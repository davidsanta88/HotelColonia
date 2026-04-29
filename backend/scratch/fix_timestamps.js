const mongoose = require('mongoose');
require('dotenv').config();

const fixData = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const Gasto = mongoose.model('Gasto', new mongoose.Schema({}, { strict: false }));

        // IDs from previous script output
        const idsToFix = [
            '69f154f2f68891578e805273', // NOMINA ISA
            '69f1559e47c1218aea45a296'  // NOMINA SEBAS
        ];

        // Set to start of today (April 29, 2026 00:00:01 -05:00)
        const newDate = new Date('2026-04-29T00:00:01-05:00');

        for (const id of idsToFix) {
            const res = await Gasto.updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: { fecha: newDate } }
            );
            console.log(`Updated ${id}:`, res);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

fixData();
