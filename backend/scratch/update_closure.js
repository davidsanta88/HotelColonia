const mongoose = require('mongoose');
require('dotenv').config();
const CierreCaja = require('../models/CierreCaja');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const result = await CierreCaja.updateOne(
            { _id: '69e03cbc58221232f1aa590b' },
            { 
                $set: { 
                    'medios_pago.efectivo': 0, 
                    saldo_real: 0 
                } 
            }
        );
        console.log('Update result:', result);
    } catch (err) {
        console.error('Error updating:', err);
    } finally {
        process.exit(0);
    }
});

