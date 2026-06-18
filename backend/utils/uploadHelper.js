const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary only if environment keys are active and not mock values
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'mock_cloud' &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'mock_key';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads a local file to Cloudinary or falls back to local URL
 * @param {Object} file - Multer file object
 * @returns {Promise<String>} - URL of the uploaded file
 */
const uploadToCloudOrLocal = async (file) => {
  if (!file) return null;

  const localUrl = `/uploads/${file.filename}`;
  
  if (!isCloudinaryConfigured) {
    return localUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: 'task_management_system'
    });

    // Remove file from local storage after successful upload to Cloudinary
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting local temp file:', err);
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Failed, falling back to local file. Error:', error.message);
    return localUrl;
  }
};

module.exports = {
  uploadToCloudOrLocal,
  isCloudinaryConfigured
};
