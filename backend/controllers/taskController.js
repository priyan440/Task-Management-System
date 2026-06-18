const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadToCloudOrLocal } = require('../utils/uploadHelper');

// Helper to log user activities
const logActivity = async (userId, action, targetId, targetType, details) => {
  try {
    await ActivityLog.create({ user: userId, action, targetId, targetType, details });
  } catch (err) {
    console.error('Activity logging failed:', err.message);
  }
};

// @desc    Get all tasks for a workspace with query filters
// @route   GET /api/v1/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { 
      workspaceId, 
      search, 
      status, 
      priority, 
      category, 
      tag, 
      sortBy, 
      page = 1, 
      limit = 100 
    } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Please provide workspaceId' });
    }

    const query = { workspace: workspaceId };

    // Search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      // Note: for JSON DB fallback, we support $or arrays. The fallback engine searches using regex if possible,
      // so let's make sure jsonDb matches substrings for strings!
    }

    // Status filter
    if (status) {
      query.status = status;
    } else {
      // Exclude Archived by default, unless explicitly requested
      query.status = { $ne: 'Archived' };
    }

    // Other filters
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };

    // Find and populate
    let taskQuery = Task.find(query);

    // Sorting
    if (sortBy) {
      let sortOpt = {};
      if (sortBy === 'dueDate') sortOpt.dueDate = 1;
      else if (sortBy === 'dueDate_desc') sortOpt.dueDate = -1;
      else if (sortBy === 'priority') sortOpt.priority = 1;
      else if (sortBy === 'progress') sortOpt.progress = -1;
      else if (sortBy === 'title') sortOpt.title = 1;
      else sortOpt.createdAt = -1;
      
      taskQuery = taskQuery.sort(sortOpt);
    } else {
      taskQuery = taskQuery.sort({ pinned: -1, createdAt: -1 });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with populate
    const tasks = await taskQuery
      .populate('assignedTo')
      .populate('creator');

    // For simplicity with fallback, return all tasks or apply mock skip/limit if needed.
    // Our JSON DB loader returns everything which is safe for our dashboard scope.
    res.status(200).json({
      success: true,
      count: tasks.length,
      page: pageNum,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single task detail
// @route   GET /api/v1/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo')
      .populate('creator')
      .populate('comments');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/v1/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { 
      title, description, category, priority, status, 
      startDate, dueDate, tags, estimatedHours, assignedTo, workspaceId, color, icon
    } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json({ success: false, message: 'Please provide task title and workspaceId' });
    }

    // Parse items if sent as JSON strings (like attachments or arrays in multipart forms)
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch(e) { parsedTags = tags.split(',').map(t => t.trim()); }
    }
    let parsedAssigned = assignedTo;
    if (typeof assignedTo === 'string') {
      try { parsedAssigned = JSON.parse(assignedTo); } catch(e) { parsedAssigned = [assignedTo]; }
    }

    const task = await Task.create({
      title,
      description: description || '',
      category: category || 'Work',
      priority: priority || 'Medium',
      status: status || 'Todo',
      startDate,
      dueDate,
      tags: parsedTags || [],
      estimatedHours: parseFloat(estimatedHours) || 0,
      assignedTo: parsedAssigned || [],
      workspace: workspaceId,
      creator: req.user._id,
      color: color || '#6366F1',
      icon: icon || '',
      checklist: []
    });

    // Notify assigned users
    if (parsedAssigned && parsedAssigned.length > 0) {
      for (const userId of parsedAssigned) {
        if (String(userId) !== String(req.user._id)) {
          await Notification.create({
            user: userId,
            content: `You have been assigned to task: "${title}" by ${req.user.name}`,
            type: 'assignment',
            link: `/tasks/${task._id}`
          });
        }
      }
    }

    await logActivity(req.user._id, 'CREATE_TASK', task._id, 'Task', `Created task: "${title}"`);

    // Emit live event to Socket server
    const io = req.app.get('socketio');
    if (io) {
      io.to(workspaceId).emit('task-created', task);
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const fieldsToUpdate = { ...req.body };

    // Process parsing for arrays if sent as multipart strings
    if (typeof fieldsToUpdate.tags === 'string') {
      try { fieldsToUpdate.tags = JSON.parse(fieldsToUpdate.tags); } catch (e) {}
    }
    if (typeof fieldsToUpdate.assignedTo === 'string') {
      try { fieldsToUpdate.assignedTo = JSON.parse(fieldsToUpdate.assignedTo); } catch (e) {}
    }
    if (typeof fieldsToUpdate.checklist === 'string') {
      try { fieldsToUpdate.checklist = JSON.parse(fieldsToUpdate.checklist); } catch (e) {}
    }

    // Recalculate progress percentage if checklist was updated
    if (fieldsToUpdate.checklist && Array.isArray(fieldsToUpdate.checklist)) {
      const items = fieldsToUpdate.checklist;
      if (items.length === 0) {
        fieldsToUpdate.progress = fieldsToUpdate.status === 'Completed' ? 100 : 0;
      } else {
        const doneCount = items.filter(item => item.done).length;
        fieldsToUpdate.progress = Math.round((doneCount / items.length) * 100);
      }
    }

    // Handle File Attachments
    if (req.files && req.files.length > 0) {
      const currentAttachments = task.attachments || [];
      const newAttachments = [];
      
      for (const file of req.files) {
        const url = await uploadToCloudOrLocal(file);
        newAttachments.push({
          name: file.originalname,
          url: url,
          type: file.mimetype.split('/')[0]
        });
      }

      fieldsToUpdate.attachments = [...currentAttachments, ...newAttachments];
    }

    // Force status completed if progress is 100%
    if (fieldsToUpdate.progress === 100 && fieldsToUpdate.status !== 'Completed') {
      fieldsToUpdate.status = 'Completed';
    }

    // Update
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('assignedTo').populate('creator');

    await logActivity(req.user._id, 'UPDATE_TASK', task._id, 'Task', `Updated task: "${updatedTask.title}"`);

    // Emit live event to Socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(String(updatedTask.workspace)).emit('task-updated', updatedTask);
    }

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Keep copies for simple Undo history support in client
    await Task.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'DELETE_TASK', task._id, 'Task', `Deleted task: "${task.title}"`);

    const io = req.app.get('socketio');
    if (io) {
      io.to(String(task.workspace)).emit('task-deleted', { id: task._id, workspaceId: task.workspace });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Task deleted successfully',
      data: task // return deleted task details for client Undo memory cache
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate a task
// @route   POST /api/v1/tasks/:id/duplicate
// @access  Private
exports.duplicateTask = async (req, res, next) => {
  try {
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const duplicated = await Task.create({
      title: `${originalTask.title} (Copy)`,
      description: originalTask.description,
      category: originalTask.category,
      priority: originalTask.priority,
      status: originalTask.status,
      startDate: originalTask.startDate,
      dueDate: originalTask.dueDate,
      tags: originalTask.tags,
      estimatedHours: originalTask.estimatedHours,
      assignedTo: originalTask.assignedTo,
      workspace: originalTask.workspace,
      creator: req.user._id,
      color: originalTask.color,
      icon: originalTask.icon,
      checklist: originalTask.checklist.map(item => ({ text: item.text, done: false })),
      progress: 0
    });

    await logActivity(req.user._id, 'DUPLICATE_TASK', duplicated._id, 'Task', `Duplicated task: "${originalTask.title}"`);

    const io = req.app.get('socketio');
    if (io) {
      io.to(String(duplicated.workspace)).emit('task-created', duplicated);
    }

    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Updates (e.g. status changes, bulk assignments)
// @route   POST /api/v1/tasks/bulk-update
// @access  Private
exports.bulkUpdateTasks = async (req, res, next) => {
  try {
    const { taskIds, updates, workspaceId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide taskIds array' });
    }

    for (const id of taskIds) {
      await Task.findByIdAndUpdate(id, updates);
    }

    await logActivity(req.user._id, 'BULK_UPDATE', taskIds.join(','), 'Task', `Bulk updated ${taskIds.length} tasks`);

    const io = req.app.get('socketio');
    if (io && workspaceId) {
      io.to(workspaceId).emit('board-reload', { workspaceId });
    }

    res.status(200).json({ success: true, message: `Successfully updated ${taskIds.length} tasks` });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Delete
// @route   POST /api/v1/tasks/bulk-delete
// @access  Private
exports.bulkDeleteTasks = async (req, res, next) => {
  try {
    const { taskIds, workspaceId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide taskIds array' });
    }

    for (const id of taskIds) {
      await Task.findByIdAndDelete(id);
    }

    await logActivity(req.user._id, 'BULK_DELETE', taskIds.join(','), 'Task', `Bulk deleted ${taskIds.length} tasks`);

    const io = req.app.get('socketio');
    if (io && workspaceId) {
      io.to(workspaceId).emit('board-reload', { workspaceId });
    }

    res.status(200).json({ success: true, message: `Successfully deleted ${taskIds.length} tasks` });
  } catch (error) {
    next(error);
  }
};

// @desc    Export tasks as CSV data
// @route   GET /api/v1/tasks/export/csv
// @access  Private
exports.exportCSV = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Please provide workspaceId' });
    }

    const tasks = await Task.find({ workspace: workspaceId }).populate('assignedTo');
    
    // Create CSV content headers
    let csvContent = 'ID,Title,Description,Status,Priority,Category,Progress,Estimated Hours,Due Date,Assignees\n';
    
    tasks.forEach(task => {
      const assignNames = task.assignedTo ? task.assignedTo.map(u => u.name).join('; ') : '';
      const row = [
        task._id,
        `"${(task.title || '').replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        task.status,
        task.priority,
        task.category,
        `${task.progress}%`,
        task.estimatedHours,
        task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        `"${assignNames}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_backup.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
