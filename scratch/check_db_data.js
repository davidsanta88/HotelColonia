const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const Registro = mongoose.model('Registro', new mongoose.Schema({}, { strict: false }));
        const Venta = mongoose.model('Venta', new mongoose.Schema({}, { strict: false }));
        const Gasto = mongoose.model('Gasto', new mongoose.Schema({}, { strict: false }));

        const start = new Date('2026-04-01T00:00:00-05:00');
        const end = new Date('2026-04-29T23:59:59-05:00');

        const registros = await Registro.countDocuments({ "pagos.fecha": { $gte: start, $lte: end } });
        const ventas = await Venta.countDocuments({ fecha: { $gte: start, $lte: end } });
        const gastos = await Gasto.countDocuments({ fecha: { $gte: start, $lte: end } });

        console.log('Registros with payments in April:', registros);
        console.log('Ventas in April:', ventas);
        console.log('Gastos in April:', gastos);

        const totalRegistros = await Registro.countDocuments();
        console.log('Total Registros in DB:', totalRegistros);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkDB();
