const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const VentaSchema = new mongoose.Schema({
    total: Number,
    fecha: { type: Date, default: Date.now }
});

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
const COLONIAL_URI = process.env.COLONIAL_MONGODB_URI || 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

async function checkVentas() {
    const inicio = moment.tz("2026-05-01", "America/Bogota").startOf('month').toDate();
    const fin = moment.tz("2026-05-31", "America/Bogota").endOf('month').toDate();

    console.log(`Checking from ${inicio.toISOString()} to ${fin.toISOString()}`);

    try {
        const plazaConn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const PlazaVenta = plazaConn.model('Venta', VentaSchema);
        const plazaCount = await PlazaVenta.countDocuments({ fecha: { $gte: inicio, $lte: fin } });
        const plazaTotal = await PlazaVenta.aggregate([
            { $match: { fecha: { $gte: inicio, $lte: fin } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        console.log(`Plaza Ventas: count=${plazaCount}, total=${plazaTotal[0]?.total || 0}`);
        await plazaConn.close();

        const colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
        const ColonialVenta = colonialConn.model('Venta', VentaSchema);
        const colonialCount = await ColonialVenta.countDocuments({ fecha: { $gte: inicio, $lte: fin } });
        const colonialTotal = await ColonialVenta.aggregate([
            { $match: { fecha: { $gte: inicio, $lte: fin } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        console.log(`Colonial Ventas: count=${colonialCount}, total=${colonialTotal[0]?.total || 0}`);
        await colonialConn.close();

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkVentas();
