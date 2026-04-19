const mongoose = require('mongoose');
const CierreCaja = require('../models/CierreCaja');
const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');

// Configuración para la conexión al Hotel Colonial
const COLONIAL_URI = 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

// Variable para mantener la conexión
let colonialConn = null;

const getColonialConnection = async () => {
    if (colonialConn && colonialConn.readyState === 1) return colonialConn;
    colonialConn = await mongoose.createConnection(COLONIAL_URI).asPromise();
    return colonialConn;
};

// Modelos para la conexión Colonial (usando los mismos esquemas)
const getColonialModels = async () => {
    const conn = await getColonialConnection();
    return {
        CierreCaja: conn.model('CierreCaja', CierreCaja.schema),
        Venta: conn.model('Venta', Venta.schema),
        Registro: conn.model('Registro', Registro.schema),
        Gasto: conn.model('Gasto', Gasto.schema)
    };
};

exports.getComparativeStats = async (req, res) => {
    try {
        const { period } = req.query; // 'day' o 'month'
        const now = new Date();
        
        // Plaza Stats (Current DB)
        const plazaData = await getStatsFromDB({
            CierreCaja, Venta, Registro, Gasto
        }, period);

        // Colonial Stats
        const colonialModels = await getColonialModels();
        const colonialData = await getStatsFromDB(colonialModels, period);

        res.json({
            plaza: plazaData,
            colonial: colonialData
        });
    } catch (error) {
        console.error('Error fetching comparative stats:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas comparativas', error: error.message });
    }
};

async function getStatsFromDB(models, period) {
    const { Venta, Registro, Gasto } = models;
    
    const now = new Date();
    let startDate;
    
    if (period === 'month') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 15);
    }

    // 1. Aggregation for Venta (Income)
    const ventaStats = await Venta.aggregate([
        { $match: { fecha: { $gte: startDate } } },
        {
            $group: {
                _id: period === 'month' ? { $month: "$fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                total: { $sum: "$total" }
            }
        }
    ]);

    // 2. Aggregation for Registro (Income from pagos)
    const registroStats = await Registro.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.fecha": { $gte: startDate } } },
        {
            $group: {
                _id: period === 'month' ? { $month: "$pagos.fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha" } },
                total: { $sum: "$pagos.monto" }
            }
        }
    ]);

    // 3. Aggregation for Gasto (Expenses)
    const gastoStats = await Gasto.aggregate([
        { $match: { fecha: { $gte: startDate } } },
        {
            $group: {
                _id: period === 'month' ? { $month: "$fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                total: { $sum: "$monto" }
            }
        }
    ]);

    // Merge results
    const resultsMap = new Map();

    const addToMap = (stats, key) => {
        stats.forEach(s => {
            const entry = resultsMap.get(s._id) || { ingresos: 0, egresos: 0 };
            if (key === 'ingresos') entry.ingresos += s.total;
            else entry.egresos += s.total;
            resultsMap.set(s._id, entry);
        });
    };

    addToMap(ventaStats, 'ingresos');
    addToMap(registroStats, 'ingresos');
    addToMap(gastoStats, 'egresos');

    // Convert to sorted array
    const sortedKeys = Array.from(resultsMap.keys()).sort();
    
    return sortedKeys.map(k => {
        const data = resultsMap.get(k);
        let label = k;
        if (period === 'month') {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            label = months[parseInt(k) - 1];
        } else {
            label = k.split('-').slice(1).reverse().join('/'); // MM-DD to DD/MM
        }
        
        return {
            label,
            ingresos: data.ingresos,
            egresos: data.egresos,
            margen: data.ingresos - data.egresos
        };
    });
}
