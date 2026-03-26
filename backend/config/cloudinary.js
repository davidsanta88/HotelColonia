const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Prioritize CLOUDINARY_URL if available (Standard on many cloud platforms)
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        secure: true
    });
    console.log('[CLOUDINARY] Configured using CLOUDINARY_URL environment variable.');
} else {
    // Fallback to individual keys
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    
    if (process.env.CLOUDINARY_API_KEY) {
        console.log('[CLOUDINARY] Configured using individual API keys.');
    } else {
        console.warn('[CLOUDINARY] WARNING: No configuration (CLOUDINARY_URL or keys) found! Image uploads will fail.');
    }
}

module.exports = cloudinary;
