const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

const statsController = require('./controllers/statsController');

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function debugController() {
    console.log('Connecting to Plaza DB...');
    await mongoose.connect(PLAZA_URI);
    console.log('Connected.');

    const req = {
        query: {
            inicio: '2026-05-01',
            fin: '2026-05-31'
        }
    };
    const res = {
        json: (data) => {
            console.log('CONTROLLER RESULT:');
            const plazaMay1 = data.plaza.history.find(h => h.label === '01/05');
            const plazaMay2 = data.plaza.history.find(h => h.label === '02/05');
            console.log('Plaza May 1:', JSON.stringify(plazaMay1, null, 2));
            console.log('Plaza May 2:', JSON.stringify(plazaMay2, null, 2));
            
            const totalTienda = data.plaza.history.reduce((acc, curr) => acc + (curr.tienda || 0), 0);
            console.log('Total Tienda (Plaza):', totalTienda);
            
            process.exit();
        },
        status: (code) => ({
            json: (err) => {
                console.error('ERROR', code, err);
                process.exit(1);
            }
        })
    };

    try {
        await statsController.getComparativeStats(req, res);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugController();
