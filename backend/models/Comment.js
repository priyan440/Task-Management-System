const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const commentSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

let CommentModel;
if (db.useMongo()) {
  CommentModel = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
} else {
  CommentModel = new JsonModel('Comment');
}

module.exports = CommentModel;
