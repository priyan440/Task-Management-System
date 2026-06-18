const mongoose = require('mongoose');
const db = require('../config/db');
const JsonModel = require('./jsonDb');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'User'],
    default: 'User'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

let UserModel;
if (db.useMongo()) {
  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
} else {
  UserModel = new JsonModel('User');
}

module.exports = UserModel;
