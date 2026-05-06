const Tarifa = require('../models/Tarifa');
const HotelConfig = require('../models/HotelConfig');
const moment = require('moment-timezone');

// Festivos Colombia 2025-2026 (fijos + móviles aproximados)
const FESTIVOS_DEFAULT = [
    '01-01', '05-01', '07-20', '08-07', '08-15', '10-12', '11-01', '11-11', '12-08', '12-25',
    '2025-03-24', '2025-04-17', '2025-04-18', '2025-06-02', '2025-06-23', '2025-06-30', '2025-08-18', '2025-10-20', '2025-11-03', '2025-11-17',
    '2026-04-02', '2026-04-03', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-22', '2026-08-17', '2026-10-19', '2026-11-02', '2026-11-16',
];

const getTipoDia = (fecha, festivosExtra = []) => {
    const m = moment.tz(fecha || new Date(), 'America/Bogota');
    const dow = m.day(); // 0=dom, 6=sab
    const mmdd = m.format('MM-DD');
    const yyyymmdd = m.format('YYYY-MM-DD');
    const esFestivo = [...FESTIVOS_DEFAULT, ...festivosExtra].some(f => f === mmdd || f === yyyymmdd);
    if (esFestivo) return 'festivo';
    if (dow === 0 || dow === 6) return 'fin_de_semana';
    return 'entre_semana';
};

exports.getTarifas = async (req, res) => {
    try {
        const tarifas = await Tarifa.find({ activo: true }).sort({ nombre: 1 });
        const config = await HotelConfig.findOne();
        const festivosExtra = config?.festivosExtra || [];
        const fecha = req.query.fecha || new Date();
        const tipoDia = getTipoDia(fecha, festivosExtra);
        res.json({ tarifas, tipoDia, fecha: moment.tz(fecha, 'America/Bogota').format('YYYY-MM-DD') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllTarifas = async (req, res) => {
    try {
        const tarifas = await Tarifa.find().sort({ nombre: 1 });
        res.json(tarifas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTarifa = async (req, res) => {
    try {
        const tarifa = await Tarifa.create(req.body);
        res.status(201).json(tarifa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTarifa = async (req, res) => {
    try {
        const tarifa = await Tarifa.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(tarifa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTarifa = async (req, res) => {
    try {
        await Tarifa.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tarifa eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTipoDiaActual = async (req, res) => {
    try {
        const config = await HotelConfig.findOne();
        const festivosExtra = config?.festivosExtra || [];
        const fecha = req.query.fecha;
        const tipoDia = getTipoDia(fecha, festivosExtra);
        const m = moment.tz(fecha || new Date(), 'America/Bogota');
        res.json({
            tipoDia,
            fecha: m.format('YYYY-MM-DD'),
            diaSemana: m.format('dddd'),
            label: tipoDia === 'festivo' ? 'Festivo' : tipoDia === 'fin_de_semana' ? 'Fin de Semana' : 'Entre Semana'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
