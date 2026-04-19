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
    const { CierreCaja } = models;
    
    // Obtener los últimos 30 cierres de caja para la comparativa diaria
    // O los últimos 12 meses si es mensual
    if (period === 'month') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const stats = await CierreCaja.aggregate([
            { $match: { fecha: { $gte: startOfYear } } },
            {
                $group: {
                    _id: { $month: "$fecha" },
                    ingresos: { $sum: "$ingresos" },
                    egresos: { $sum: "$egresos" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        return stats.map(s => ({
            label: `Mes ${s._id}`,
            ingresos: s.ingresos,
            egresos: s.egresos,
            margen: s.ingresos - s.egresos
        }));
    } else {
        // Daily (last 15 days)
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        
        const stats = await CierreCaja.find({ fecha: { $gte: fifteenDaysAgo } })
            .sort({ fecha: 1 })
            .limit(15);
            
        return stats.map(s => ({
            label: new Date(s.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
            ingresos: s.ingresos,
            egresos: s.egresos,
            margen: s.ingresos - s.egresos
        }));
    }
}
