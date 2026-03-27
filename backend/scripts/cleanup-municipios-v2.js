const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Municipio = require('../models/Municipio');

async function cleanup() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Deleting records where name contains the joined pattern or is too long
        // The screenshot shows "AMAZONAS-EL ENCANTO AMAZONAS-LA CHORRERA" (joined by space)
        const corrupted = await Municipio.find({ 
            nombre: /AMAZONAS-EL ENCANTO AMAZONAS-LA CHORRERA/ 
        });

        console.log(`Found ${corrupted.length} corrupted records.`);
        
        if (corrupted.length > 0) {
            const ids = corrupted.map(m => m._id);
            const res = await Municipio.deleteMany({ _id: { $in: ids } });
            console.log(`Deleted ${res.deletedCount} corrupted records.`);
        }

        const count = await Municipio.countDocuments();
        console.log(`Remaining municipios: ${count}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
    }
}

cleanup();
