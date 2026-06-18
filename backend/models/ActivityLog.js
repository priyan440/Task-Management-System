const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g. 'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'COMPLETE_TASK', 'LOGIN'
  },
  targetId: {
    type: String,
    default: ''
  },
  targetType: {
    type: String,
    default: '' // e.g. 'Task', 'Comment', 'Workspace', 'User'
  },
  details: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

let ActivityLogModel;
if (db.useMongo()) {
  ActivityLogModel = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
} else {
  ActivityLogModel = new JsonModel('ActivityLog');
}

module.exports = ActivityLogModel;
