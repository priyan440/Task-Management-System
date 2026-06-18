const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: '💼'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'User'],
      default: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

let WorkspaceModel;
if (db.useMongo()) {
  WorkspaceModel = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
} else {
  WorkspaceModel = new JsonModel('Workspace');
}

module.exports = WorkspaceModel;
