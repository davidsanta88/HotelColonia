const mongoose = require('mongoose');
const CierreCaja = require('../models/CierreCaja');
const Venta = require('../models/Venta');
const Registro = require('../models/Registro');
const Gasto = require('../models/Gasto');
const CategoriaGasto = require('../models/CategoriaGasto');
const Habitacion = require('../models/Habitacion');
const EstadoHabitacion = require('../models/EstadoHabitacion');

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
        Gasto: conn.model('Gasto', Gasto.schema),
        CategoriaGasto: conn.model('CategoriaGasto', CategoriaGasto.schema),
        Habitacion: conn.model('Habitacion', Habitacion.schema),
        EstadoHabitacion: conn.model('EstadoHabitacion', EstadoHabitacion.schema)
    };
};

exports.getComparativeStats = async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        
        // Plaza Stats (Current DB)
        const plazaData = await getStatsFromDB({
            Venta, Registro, Gasto
        }, inicio, fin);
        const plazaRooms = await getRoomCounts(Habitacion);

        // Colonial Stats
        const colonialModels = await getColonialModels();
        const colonialData = await getStatsFromDB(colonialModels, inicio, fin);
        const colonialRooms = await getRoomCounts(colonialModels.Habitacion);

        res.json({
            plaza: {
                history: plazaData,
                rooms: plazaRooms
            },
            colonial: {
                history: colonialData,
                rooms: colonialRooms
            }
        });
    } catch (error) {
        console.error('Error fetching comparative stats:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas comparativas', error: error.message });
    }
};

async function getRoomCounts(HabitacionModel) {
    try {
        const stats = await HabitacionModel.aggregate([
            {
                $lookup: {
                    from: 'estadohabitacions',
                    localField: 'estado',
                    foreignField: '_id',
                    as: 'estadoInfo'
                }
            },
            { $unwind: { path: '$estadoInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$estadoInfo.nombre',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = { disponibles: 0, ocupadas: 0, total: 0 };
        stats.forEach(s => {
            const nombre = (s._id || '').toLowerCase();
            if (nombre.includes('disponible')) result.disponibles += s.count;
            else if (nombre.includes('ocupada')) result.ocupadas += s.count;
            result.total += s.count;
        });
        return result;
    } catch (error) {
        console.error('Error counting rooms:', error);
        return { disponibles: 0, ocupadas: 0, total: 0 };
    }
}

async function getStatsFromDB(models, startDateStr, endDateStr) {
    const { Venta, Registro, Gasto } = models;
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Determinar si debemos agrupar por mes o por día basándonos en el rango
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const useMonthly = diffDays > 60;

    // 1. Aggregation for Venta (Income)
    const ventaStats = await Venta.aggregate([
        { $match: { fecha: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: "$fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                total: { $sum: "$total" }
            }
        }
    ]);

    // 2. Aggregation for Registro (Income from pagos)
    const registroStats = await Registro.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.fecha": { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: useMonthly ? { $month: "$pagos.fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$pagos.fecha" } },
                total: { $sum: "$pagos.monto" }
            }
        }
    ]);

    // 3. Aggregation for Gasto (Expenses AND Manual Incomes)
    const gastoStats = await Gasto.aggregate([
        { $match: { fecha: { $gte: startDate, $lte: endDate } } },
        {
            $lookup: {
                from: 'categoriagastos',
                localField: 'categoria',
                foreignField: '_id',
                as: 'catInfo'
            }
        },
        { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: useMonthly ? { $month: "$fecha" } : { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
                totalGasto: {
                    $sum: { $cond: [{ $eq: ["$catInfo.tipo", "Ingreso"] }, 0, "$monto"] }
                },
                totalIngreso: {
                    $sum: { $cond: [{ $eq: ["$catInfo.tipo", "Ingreso"] }, "$monto", 0] }
                }
            }
        }
    ]);

    // Merge results
    const resultsMap = new Map();

    const addToMap = (stats, key) => {
        stats.forEach(s => {
            const entry = resultsMap.get(s._id) || { ingresos: 0, egresos: 0 };
            if (key === 'ingresos') entry.ingresos += s.total;
            else if (key === 'gastos_mixed') {
                entry.ingresos += s.totalIngreso || 0;
                entry.egresos += s.totalGasto || 0;
            }
            else entry.egresos += s.total;
            resultsMap.set(s._id, entry);
        });
    };

    addToMap(ventaStats, 'ingresos');
    addToMap(registroStats, 'ingresos');
    addToMap(gastoStats, 'gastos_mixed');

    // Convert to sorted array
    const sortedKeys = Array.from(resultsMap.keys()).sort();
    
    return sortedKeys.map(k => {
        const data = resultsMap.get(k);
        let label = k;
        if (useMonthly) {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            label = months[parseInt(k) - 1];
        } else {
            // Formatear fecha para mostrar (DD/MM)
            try {
                const [y, m, d] = k.split('-');
                label = `${d}/${m}`;
            } catch (e) {
                label = k;
            }
        }
        
        return {
            label,
            ingresos: data.ingresos,
            egresos: data.egresos,
            margen: data.ingresos - data.egresos
        };
    });
}
