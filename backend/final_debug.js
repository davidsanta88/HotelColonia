const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

// Import models
const Venta = require('./models/Venta');
const Registro = require('./models/Registro');
const Gasto = require('./models/Gasto');
const Comanda = require('./models/Comanda');

// Re-implement getStatsFromDB logic locally to debug
async function debugGetStatsFromDB(models, startDateStr, endDateStr, totalRooms = 1) {
    const { Venta, Registro, Gasto, Comanda } = models;
    const startDate = moment.tz(startDateStr, "America/Bogota").startOf('day').toDate();
    const endDate = moment.tz(endDateStr, "America/Bogota").endOf('day').toDate();
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const useMonthly = diffDays > 60;

    const ventaStats = await Venta.aggregate([
        { $match: { fecha: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: { date: "$fecha", timezone: "America/Bogota" } } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "America/Bogota" } },
                total: { $sum: "$total" }
            }
        }
    ]);

    const registroStats = await Registro.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.fecha": { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: { date: "$pagos.fecha", timezone: "America/Bogota" } } : { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha", timezone: "America/Bogota" } },
                total: { $sum: "$pagos.monto" }
            }
        }
    ]);

    const resultsMap = new Map();
    const addToMap = (stats, key) => {
        stats.forEach(s => {
            const entry = resultsMap.get(s._id) || { ingresos: 0, egresos: 0, hospedaje: 0, tienda: 0, otros: 0 };
            if (key === 'tienda') {
                entry.ingresos += s.total;
                entry.tienda += s.total;
            } else if (key === 'hospedaje') {
                entry.ingresos += s.total;
                entry.hospedaje += s.total;
            }
            resultsMap.set(s._id, entry);
        });
    };

    addToMap(ventaStats, 'tienda');
    addToMap(registroStats, 'hospedaje');

    const sortedKeys = Array.from(resultsMap.keys()).sort();
    return sortedKeys.map(k => {
        const data = resultsMap.get(k);
        return { label: k, tienda: data.tienda, ingresos: data.ingresos };
    });
}

async function runTest() {
    try {
        await mongoose.connect(PLAZA_URI);
        const results = await debugGetStatsFromDB({ Venta, Registro, Gasto, Comanda }, "2026-05-01", "2026-05-31");
        console.log('Results:', JSON.stringify(results, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

runTest();
