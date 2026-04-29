const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;
const cl_url = process.env.CLOUDINARY_URL;

console.log('[CLOUDINARY-INIT] Environment Check:');
console.log(`- CLOUDINARY_URL: ${cl_url ? 'PRESENT' : 'MISSING'}`);
console.log(`- CLOUDINARY_CLOUD_NAME: ${cloud_name ? 'PRESENT' : 'MISSING'}`);
console.log(`- CLOUDINARY_API_KEY: ${api_key ? 'PRESENT' : 'MISSING'}`);
console.log(`- CLOUDINARY_API_SECRET: ${api_secret ? 'PRESENT' : 'MISSING'}`);

if (cl_url) {
    cloudinary.config({ secure: true });
} else if (cloud_name && api_key && api_secret) {
    cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true
    });
} else {
    console.error('[CLOUDINARY-INIT] ERROR: Incomplete configuration. Uploads will fail.');
}

module.exports = cloudinary;

