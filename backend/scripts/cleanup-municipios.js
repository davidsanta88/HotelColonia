const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Municipio = require('../models/Municipio');

async function cleanup() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Deleting records where name length > 60 characters
        const result = await Municipio.deleteMany({
            $expr: { $gt: [{ $strLenCP: '$nombre' }, 60] }
        });
        
        console.log('--- CLEANUP COMPLETED ---');
        console.log(`Deleted corrupted records: ${result.deletedCount}`);
        
        const count = await Municipio.countDocuments();
        console.log(`Remaining municipalities in DB: ${count}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
    }
}

cleanup();

