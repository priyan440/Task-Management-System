const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const db = require('../config/db');

// @desc    Get system dashboard metrics & activity feed
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin only)
exports.getAdminMetrics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const activeTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });

    // Recent system activity logs
    const recentLogs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar')
      .exec();

    // Database diagnostics
    const databaseSystem = db.useMongo() ? 'MongoDB (Cluster Active)' : 'Local JSON Flat-file Database (Fallback mode)';

    res.status(200).json({
      success: true,
      data: {
        system: {
          databaseType: databaseSystem,
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
        },
        counts: {
          users: totalUsers,
          tasks: totalTasks,
          completedTasks,
          activeTasks
        },
        logs: recentLogs.slice(0, 15) // Limit to 15 entries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
exports.getUsersList = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details/role
// @route   PUT /api/v1/admin/users/:id
// @access  Private (Admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please provide user role' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User role updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin only)
exports.deleteUserByAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself as admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
