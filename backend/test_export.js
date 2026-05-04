const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const Venta = require('./models/Venta');
const Registro = require('./models/Registro');
const Gasto = require('./models/Gasto');
const statsController = require('./controllers/statsController');

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function testGetStats() {
    try {
        await mongoose.connect(PLAZA_URI);
        console.log('Connected.');

        // We need to pass the models as they are expected by getStatsFromDB
        // Since getStatsFromDB destructures { Venta, Registro, Gasto } from the first arg
        const models = { Venta, Registro, Gasto };
        
        const inicio = '2026-05-01';
        const fin = '2026-05-04';

        // Internal function getStatsFromDB is not exported, but it's used by getComparativeStats
        // I can't call it directly if it's not exported.
        // But I can check if it's exported.
        console.log('Is getStatsFromDB exported?', typeof statsController.getStatsFromDB);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

testGetStats();
