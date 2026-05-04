const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config({ path: '.env.local' });

// Mock models and controller
const statsController = require('./controllers/statsController');

async function debugController() {
    const req = {
        query: {
            inicio: '2026-05-01',
            fin: '2026-05-31'
        }
    };
    const res = {
        json: (data) => {
            console.log('CONTROLLER RESULT:');
            console.log('Plaza History:', JSON.stringify(data.plaza.history.slice(0, 5), null, 2));
            console.log('Colonial History:', JSON.stringify(data.colonial.history.slice(0, 5), null, 2));
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
