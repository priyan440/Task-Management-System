const mongoose = require('mongoose');
require('dotenv').config();

let isMongoConnected = false;

// We check if MONGO_URI is set and try to connect
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ No MONGO_URI specified in environment. Running with JSON Database fallback.');
    isMongoConnected = false;
    return false;
  }

  try {
    // Attempt connecting to MongoDB with a short timeout to prevent server hanging
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    console.log('\x1b[32m%s\x1b[0m', '✅ MongoDB Connected successfully.');
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ MongoDB connection failed: ${error.message}`);
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ Running with local JSON Database fallback.');
    isMongoConnected = false;
    return false;
  }
};

module.exports = {
  connectDB,
  useMongo: () => isMongoConnected
};
