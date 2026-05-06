const Encuesta = require('../models/Encuesta');
const Registro = require('../models/Registro');
const Cliente = require('../models/Cliente');
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

exports.crearDesdeRegistro = async (req, res) => {
    try {
        const { registroId } = req.params;
        const hotelNombre = req.body.hotelNombre || 'Hotel Balcón';
        const baseUrl = req.body.baseUrl || process.env.FRONTEND_URL || 'https://hotelbalconplaza.com';

        const registro = await Registro.findById(registroId)
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre telefono')
            .lean();

        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // Evitar encuestas duplicadas para el mismo registro
        const existe = await Encuesta.findOne({ registro_id: registroId });
        if (existe) {
            const url = `${baseUrl}/encuesta/${existe.token}`;
            const telefono = registro.cliente?.telefono?.replace(/\D/g, '') || '';
            const whatsappUrl = telefono
                ? `https://wa.me/57${telefono}?text=${encodeURIComponent(`¡Gracias por hospedarse en ${hotelNombre}! 🙏 Su opinión es muy importante para nosotros. Por favor califique su estadía: ${url}`)}`
                : null;
            return res.json({ encuesta: existe, url, whatsappUrl });
        }

        const token = crypto.randomBytes(16).toString('hex');
        const encuesta = await Encuesta.create({
            registro_id: registroId,
            habitacion_numero: registro.habitacion?.numero || '–',
            huesped_nombre: registro.cliente?.nombre || 'Huésped',
            hotel: hotelNombre,
            token
        });

        const url = `${baseUrl}/encuesta/${token}`;
        const telefono = registro.cliente?.telefono?.replace(/\D/g, '') || '';
        const mensaje = `¡Gracias por hospedarse en ${hotelNombre}! 🙏\n\nSu opinión es muy importante para nosotros. Por favor califique su estadía:\n${url}\n\n¡Esperamos verle pronto! 🏨`;
        const whatsappUrl = telefono
            ? `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
            : null;

        res.json({ encuesta, url, whatsappUrl, telefono });
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
