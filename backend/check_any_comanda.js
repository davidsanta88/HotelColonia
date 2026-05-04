const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function checkAnyComanda() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Comanda = conn.model('Comanda', new mongoose.Schema({}, { strict: false }));
        const count = await Comanda.countDocuments();
        console.log('Total Comandas in Plaza:', count);
        if (count > 0) {
            const one = await Comanda.findOne().sort({ fechaApertura: -1 });
            console.log('Latest Comanda:', JSON.stringify(one, null, 2));
        }
        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkAnyComanda();
