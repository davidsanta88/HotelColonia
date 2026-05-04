const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function runAggregations() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Venta = conn.model('Venta', new mongoose.Schema({}, { strict: false }));
        const Registro = conn.model('Registro', new mongoose.Schema({}, { strict: false }));
        
        const startDate = moment.tz("2026-05-01", "America/Bogota").startOf('day').toDate();
        const endDate = moment.tz("2026-05-31", "America/Bogota").endOf('day').toDate();

        console.log(`Range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

        const ventaStats = await Venta.aggregate([
            { $match: { fecha: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "America/Bogota" } },
                    total: { $sum: "$total" }
                }
            }
        ]);
        console.log('Venta Stats:', JSON.stringify(ventaStats, null, 2));

        const registroStats = await Registro.aggregate([
            { $unwind: "$pagos" },
            { $match: { "pagos.fecha": { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha", timezone: "America/Bogota" } },
                    total: { $sum: "$pagos.monto" }
                }
            }
        ]);
        console.log('Registro Stats:', JSON.stringify(registroStats.slice(0, 5), null, 2));

        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

runAggregations();
