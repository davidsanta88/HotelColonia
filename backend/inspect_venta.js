const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function inspectVenta() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Venta = conn.model('Venta', new mongoose.Schema({}, { strict: false }));
        const oneVenta = await Venta.findOne().sort({ fecha: -1 });
        console.log('One Venta record:', JSON.stringify(oneVenta, null, 2));
        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

inspectVenta();
