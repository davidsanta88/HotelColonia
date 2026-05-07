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
            .populate('habitacion', 'numero tipo')
            .populate('cliente', 'nombre telefono')
            .lean();

        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // Calcular resumen financiero
        const totalCobrado = registro.total || 0;
        const totalPagado = (registro.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
        const saldo = Math.max(0, totalCobrado - totalPagado);

        // Calcular noches
        const entrada = registro.fechaEntrada ? new Date(registro.fechaEntrada) : null;
        const salidaReal = registro.fechaSalidaReal || registro.fechaSalida;
        const salida = salidaReal ? new Date(salidaReal) : new Date();
        const noches = entrada ? Math.max(1, Math.ceil((salida - entrada) / (1000 * 60 * 60 * 24))) : 1;

        const fmt = (d) => {
            if (!d) return '–';
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return '–';
                const bog = new Date(date.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
                return `${String(bog.getDate()).padStart(2,'0')}/${String(bog.getMonth()+1).padStart(2,'0')}/${bog.getFullYear()}`;
            } catch { return String(d).split('T')[0]; }
        };
        const fmtCop = (v) => { try { return `$${Number(v||0).toLocaleString('es-CO')}`; } catch { return `$${Number(v||0).toLocaleString()}`; } };

        // Evitar encuestas duplicadas
        const existe = await Encuesta.findOne({ registro_id: registroId });
        const token = existe ? existe.token : crypto.randomBytes(16).toString('hex');
        if (!existe) {
            await Encuesta.create({
                registro_id: registroId,
                habitacion_numero: registro.habitacion?.numero || '–',
                huesped_nombre: registro.cliente?.nombre || 'Huésped',
                hotel: hotelNombre,
                token
            });
        }

        const url = `${baseUrl}/encuesta/${token}`;
        const telefono = (registro.cliente?.telefono || '').replace(/\D/g, '');

        const mensaje =
`🏨 *${hotelNombre.toUpperCase()}*

Estimado/a *${registro.cliente?.nombre || 'Huésped'}*,

Ha sido un placer recibirle. Esperamos que su estadía haya superado sus expectativas y que pronto nos vuelva a visitar.

📋 *RESUMEN DE SU ESTADÍA*
🛏️ Habitación: *${registro.habitacion?.numero || '–'}*
📅 Ingreso: *${fmt(entrada)}*
📅 Salida: *${fmt(salida)}*
🌙 Noches: *${noches}*

💰 *RESUMEN FINANCIERO*
Total hospedaje: *${fmtCop(totalCobrado)}*
Total pagado: *${fmtCop(totalPagado)}*
Saldo pendiente: *${fmtCop(saldo)}*

⭐ *SU OPINIÓN NOS IMPORTA*
Por favor dedique 1 minuto a calificar su estadía:
👉 ${url}

¡Gracias por confiar en nosotros! 🙏
*${hotelNombre}*`;

        const whatsappUrl = telefono
            ? `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
            : null;

        res.json({ encuesta: existe || { token }, url, whatsappUrl, telefono, mensaje });
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
