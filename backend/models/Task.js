const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Personal', 'Work', 'Study', 'Shopping', 'Fitness', 'Meetings', 'Projects', 'Important', 'Completed', 'Custom'],
    default: 'Work'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Completed', 'Archived'],
    default: 'Todo'
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  reminder: {
    type: Date
  },
  tags: [{
    type: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: { type: String }
  }],
  notes: {
    type: String,
    default: ''
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  checklist: [{
    text: String,
    done: {
      type: Boolean,
      default: false
    }
  }],
  estimatedHours: {
    type: Number,
    default: 0
  },
  timeTracked: {
    type: Number, // In minutes
    default: 0
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  favorite: {
    type: Boolean,
    default: false
  },
  recurring: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number, // Percentage 0 - 100
    default: 0
  },
  color: {
    type: String,
    default: '#6366F1'
  },
  icon: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

let TaskModel;
if (db.useMongo()) {
  TaskModel = mongoose.models.Task || mongoose.model('Task', taskSchema);
} else {
  TaskModel = new JsonModel('Task');
}

module.exports = TaskModel;
