const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const Gasto = mongoose.model('Gasto', new mongoose.Schema({}, { strict: false }));
        const CierreCaja = mongoose.model('CierreCaja', new mongoose.Schema({}, { strict: false }));

        const lastCierre = await CierreCaja.findOne().sort({ fecha: -1 });
        console.log('Latest Cierre:', lastCierre ? { 
            id: lastCierre._id, 
            fecha: lastCierre.fecha, 
            fechaISO: lastCierre.fecha.toISOString(),
            nota: lastCierre.nota 
        } : 'None');

        const start = new Date('2026-04-29T00:00:00-05:00');
        const end = new Date('2026-04-29T23:59:59-05:00');

        const gastos = await Gasto.find({ fecha: { $gte: start, $lte: end } }).sort({ fecha: -1 });
        console.log('Gastos for April 29, 2026:', gastos.map(g => ({
            id: g._id,
            descripcion: g.descripcion,
            monto: g.monto,
            fecha: g.fecha,
            fechaISO: g.fecha.toISOString(),
            medioPago: g.medioPago
        })));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkDB();
