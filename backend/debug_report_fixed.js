
const mongoose = require('mongoose');
require('dotenv').config();
const Gasto = require('./models/Gasto');
const CategoriaGasto = require('./models/CategoriaGasto');
const Registro = require('./models/Registro');
const Venta = require('./models/Venta');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const inicio = '2026-02-26';
    const fin = '2026-03-27';
    const filter = { 
        fecha: { 
            $gte: new Date(inicio), 
            $lte: new Date(fin + 'T23:59:59') 
        } 
    };

    console.log("Filter:", JSON.stringify(filter, null, 2));

    const totalGastosCount = await Gasto.countDocuments();
    console.log("Total Gastos in DB:", totalGastosCount);

    const matchCount = await Gasto.countDocuments(filter);
    console.log("Gastos matching date filter:", matchCount);

    const report = await Gasto.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'categoriagastos',
                localField: 'categoria',
                foreignField: '_id',
                as: 'catInfo'
            }
        },
        { $unwind: '$catInfo' },
        {
            $group: {
                _id: '$catInfo.tipo',
                total: { $sum: '$monto' },
                count: { $sum: 1 }
            }
        }
    ]);
    console.log("Aggregation Report:", JSON.stringify(report, null, 2));

    process.exit(0);
}

debug().catch(e => {
    console.error(e);
    process.exit(1);
});
