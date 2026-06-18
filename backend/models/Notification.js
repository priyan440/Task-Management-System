const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'comment', 'due_date', 'reminder', 'system', 'update'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
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

let NotificationModel;
if (db.useMongo()) {
  NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
} else {
  NotificationModel = new JsonModel('Notification');
}

module.exports = NotificationModel;
