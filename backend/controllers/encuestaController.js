const Encuesta = require('../models/Encuesta');
const crypto = require('crypto');

exports.crearEncuesta = async (req, res) => {
    try {
        const { registro_id, habitacion_numero, huesped_nombre, hotel } = req.body;
        const token = crypto.randomBytes(16).toString('hex');
        const encuesta = await Encuesta.create({ registro_id, habitacion_numero, huesped_nombre, hotel, token });
        const baseUrl = process.env.FRONTEND_URL || 'https://hotelbalconplaza.com';
        res.json({ encuesta, url: `${baseUrl}/encuesta/${token}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEncuestaByToken = async (req, res) => {
    try {
        const encuesta = await Encuesta.findOne({ token: req.params.token });
        if (!encuesta) return res.status(404).json({ message: 'Encuesta no encontrada' });
        res.json(encuesta);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.responderEncuesta = async (req, res) => {
    try {
        const { calificacion_general, calificacion_limpieza, calificacion_atencion, calificacion_instalaciones, recomendaria, comentario } = req.body;
        const encuesta = await Encuesta.findOne({ token: req.params.token });
        if (!encuesta) return res.status(404).json({ message: 'Encuesta no encontrada' });
        if (encuesta.completada) return res.status(400).json({ message: 'Esta encuesta ya fue respondida' });

        encuesta.calificacion_general = calificacion_general;
        encuesta.calificacion_limpieza = calificacion_limpieza;
        encuesta.calificacion_atencion = calificacion_atencion;
        encuesta.calificacion_instalaciones = calificacion_instalaciones;
        encuesta.recomendaria = recomendaria;
        encuesta.comentario = comentario;
        encuesta.completada = true;
        encuesta.fecha_completada = new Date();
        await encuesta.save();
        res.json({ message: '¡Gracias por tu opinión!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEncuestas = async (req, res) => {
    try {
        const encuestas = await Encuesta.find().sort({ createdAt: -1 }).limit(200);
        const total = encuestas.length;
        const completadas = encuestas.filter(e => e.completada);
        const promedio = (field) => {
            const vals = completadas.map(e => e[field]).filter(v => v);
            return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
        };
        res.json({
            encuestas,
            stats: {
                total,
                completadas: completadas.length,
                pendientes: total - completadas.length,
                calificacion_general: promedio('calificacion_general'),
                calificacion_limpieza: promedio('calificacion_limpieza'),
                calificacion_atencion: promedio('calificacion_atencion'),
                calificacion_instalaciones: promedio('calificacion_instalaciones'),
                recomendarian: completadas.filter(e => e.recomendaria).length,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEncuesta = async (req, res) => {
    try {
        await Encuesta.findByIdAndDelete(req.params.id);
        res.json({ message: 'Encuesta eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
