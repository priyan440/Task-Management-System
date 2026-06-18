const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc    Add a comment to a task
// @route   POST /api/v1/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ success: false, message: 'Please provide taskId and comment content' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content
    });

    // Push comment reference to task comments array
    await Task.findByIdAndUpdate(taskId, {
      $push: { comments: comment._id }
    });

    // Populate user info for client rendering
    const populatedComment = await Comment.findById(comment._id).populate('user', 'name email avatar');

    // Emit live WebSocket comment notification to workspace room
    const io = req.app.get('socketio');
    if (io) {
      io.to(String(task.workspace)).emit('new-comment', {
        taskId,
        comment: populatedComment
      });
    }

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/v1/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Authenticate: comment creator or workspace manager can delete
    if (String(comment.user) !== String(req.user._id) && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await Task.findByIdAndUpdate(comment.task, {
      $pull: { comments: comment._id }
    });

    await Comment.findByIdAndDelete(req.params.id);

    const task = await Task.findById(comment.task);
    const io = req.app.get('socketio');
    if (io && task) {
      io.to(String(task.workspace)).emit('comment-deleted', {
        taskId: comment.task,
        commentId: comment._id
      });
    }

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
