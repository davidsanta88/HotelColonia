const Turno = require('../models/Turno');
const Usuario = require('../models/Usuario');

exports.getTurnos = async (req, res) => {
    try {
        const { inicio, fin, usuario_id } = req.query;
        const filter = {};
        if (inicio && fin) {
            filter.fecha = {
                $gte: new Date(inicio + 'T00:00:00-05:00'),
                $lte: new Date(fin + 'T23:59:59-05:00')
            };
        }
        if (usuario_id) filter.usuario = usuario_id;

        const turnos = await Turno.find(filter)
            .populate('usuario', 'nombre email')
            .sort({ fecha: 1, turno: 1 });
        res.json(turnos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTurno = async (req, res) => {
    try {
        const { usuario, fecha, turno, horaInicio, horaFin, notas } = req.body;
        if (!usuario || !fecha || !turno) {
            return res.status(400).json({ message: 'Empleada, fecha y turno son obligatorios' });
        }
        const nuevo = await Turno.create({
            usuario, fecha, turno, horaInicio, horaFin, notas,
            creadoPor: req.userName || 'Sistema'
        });
        const populated = await nuevo.populate('usuario', 'nombre email');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTurno = async (req, res) => {
    try {
        const turno = await Turno.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('usuario', 'nombre email');
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });
        res.json(turno);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTurno = async (req, res) => {
    try {
        await Turno.findByIdAndDelete(req.params.id);
        res.json({ message: 'Turno eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
