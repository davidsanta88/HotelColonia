const mongoose = require('mongoose');
require('dotenv').config();
const Gasto = require('../models/Gasto');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const result = await Gasto.updateMany(
            { 
                descripcion: { $in: [/FERRETERIA/i, /NOMINA SEBAS/i] }, 
                fecha: { $gte: new Date('2026-04-16T00:00:00Z') } 
            },
            { 
                $set: { 
                    fecha: new Date('2026-04-15T15:00:00Z') 
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

