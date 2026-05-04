const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const ComandaSchema = new mongoose.Schema({
    total: Number,
    fechaApertura: { type: Date, default: Date.now }
});

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
const COLONIAL_URI = process.env.COLONIAL_MONGODB_URI || 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

async function checkComandas() {
    const inicio = moment.tz("2026-05-01", "America/Bogota").startOf('month').toDate();
    const fin = moment.tz("2026-05-31", "America/Bogota").endOf('month').toDate();

    console.log(`Checking Comandas from ${inicio.toISOString()} to ${fin.toISOString()}`);

    try {
        const plazaConn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const PlazaComanda = plazaConn.model('Comanda', ComandaSchema);
        const plazaCount = await PlazaComanda.countDocuments({ fechaApertura: { $gte: inicio, $lte: fin } });
        const plazaTotal = await PlazaComanda.aggregate([
            { $match: { fechaApertura: { $gte: inicio, $lte: fin } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        console.log(`Plaza Comandas: count=${plazaCount}, total=${plazaTotal[0]?.total || 0}`);
        await plazaConn.close();

        const colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
        const ColonialComanda = colonialConn.model('Comanda', ComandaSchema);
        const colonialCount = await ColonialComanda.countDocuments({ fechaApertura: { $gte: inicio, $lte: fin } });
        const colonialTotal = await ColonialComanda.aggregate([
            { $match: { fechaApertura: { $gte: inicio, $lte: fin } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        console.log(`Colonial Comandas: count=${colonialCount}, total=${colonialTotal[0]?.total || 0}`);
        await colonialConn.close();

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkComandas();
