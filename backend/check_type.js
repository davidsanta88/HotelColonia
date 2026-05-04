const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function checkType() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Venta = conn.model('Venta', new mongoose.Schema({}, { strict: false }));
        const oneVenta = await Venta.findOne().sort({ fecha: -1 }).lean();
        console.log('Type of fecha:', typeof oneVenta.fecha);
        console.log('Is fecha instance of Date?', oneVenta.fecha instanceof Date);
        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkType();
