const cloudinary = require('./config/cloudinary');

console.log('--- Cloudinary Test ---');
console.log('Config:', {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? '***' + cloudinary.config().api_key.slice(-4) : 'MISSING',
    secure: cloudinary.config().secure
});

async function testUpload() {
    try {
        // Upload a pixel to test
        const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', {
            folder: 'test_connection'
        });
        console.log('Upload Success:', result.secure_url);
    } catch (err) {
        console.error('Upload Failed:', err.message);
    }
}

testUpload();
