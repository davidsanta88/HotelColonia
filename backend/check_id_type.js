const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function checkIdType() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Venta = conn.model('Venta', new mongoose.Schema({}, { strict: false }));
        
        const startDate = moment.tz("2026-05-01", "America/Bogota").startOf('day').toDate();
        const endDate = moment.tz("2026-05-31", "America/Bogota").endOf('day').toDate();

        const ventaStats = await Venta.aggregate([
            { $match: { fecha: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: "America/Bogota" } },
                    total: { $sum: "$total" }
                }
            }
        ]);
        
        if (ventaStats.length > 0) {
            console.log('Type of _id:', typeof ventaStats[0]._id);
            console.log('Value of _id:', ventaStats[0]._id);
        } else {
            console.log('No stats found');
        }

        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkIdType();
