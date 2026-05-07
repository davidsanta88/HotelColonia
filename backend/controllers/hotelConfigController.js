const HotelConfig = require('../models/HotelConfig');
const cloudinary = require('../config/cloudinary');
const Registro = require('../models/Registro');

// Helper para Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'hotel/config' },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

// Obtener la configuración (Singleton)
exports.getConfig = async (req, res) => {
    try {
        let config = await HotelConfig.findOne();
        
        if (!config) {
            config = new HotelConfig({});
            await config.save();
        }
        
        res.status(200).json(config);
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ message: 'Error al obtener la configuración del hotel' });
    }
};

// Actualizar la configuración
exports.updateConfig = async (req, res) => {
    try {
        const { 
            nombre, nit, direccion, telefono, correo, politica, sitioWeb, datosBancarios, lema,
            adminNombre, adminCelular, adminDocumento, adminCorreo 
        } = req.body;
        
        let config = await HotelConfig.findOne();
        
        if (!config) {
            config = new HotelConfig(req.body);
        } else {
            Object.assign(config, req.body);
            config.updatedAt = Date.now();
        }
        
        await config.save();
        res.status(200).json(config);
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ message: 'Error al actualizar la configuración del hotel' });
    }
};

// Subir Firma
exports.uploadFirma = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        const result = await streamUpload(req.file.buffer);
        let config = await HotelConfig.findOne();
        if (!config) config = new HotelConfig({});

        config.firmaUrl = result.secure_url;
        await config.save();

        res.status(200).json({ firmaUrl: config.firmaUrl });
    } catch (error) {
        console.error('Error al subir firma:', error);
        res.status(500).json({ message: 'Error al subir la firma' });
    }
};

// Subir Logo
exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        const result = await streamUpload(req.file.buffer);
        let config = await HotelConfig.findOne();
        if (!config) config = new HotelConfig({});

        config.logoUrl = result.secure_url;
        await config.save();

        res.status(200).json({ imageUrl: config.logoUrl });
    } catch (error) {
        console.error('Error al subir logo:', error);
        res.status(500).json({ message: 'Error al subir el logo' });
    }
};

// Subir Fondo de Login
exports.uploadBackground = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        const result = await streamUpload(req.file.buffer);
        let config = await HotelConfig.findOne();
        if (!config) config = new HotelConfig({});

        config.backgroundUrl = result.secure_url;
        await config.save();

        res.status(200).json({ imageUrl: config.backgroundUrl });
    } catch (error) {
        console.error('Error al subir fondo:', error);
        res.status(500).json({ message: 'Error al subir el fondo' });
    }
};

// Generar mensaje de bienvenida WhatsApp para un registro
exports.getMensajeBienvenida = async (req, res) => {
    try {
        const { registroId } = req.params;
        const config = await HotelConfig.findOne();
        const registro = await Registro.findById(registroId)
            .populate('habitacion', 'numero tipo')
            .populate('cliente', 'nombre telefono')
            .lean();

        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const DIAS_S = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        const fmt = (d) => {
            if (!d) return '–';
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return '–';
                const bog = new Date(date.getTime() - 5 * 3600000); // UTC-5 Colombia sin DST
                return `${DIAS_S[bog.getUTCDay()]} ${bog.getUTCDate()} de ${MESES[bog.getUTCMonth()]} de ${bog.getUTCFullYear()}`;
            } catch { return String(d).split('T')[0]; }
        };
        const fmtCop = (v) => '$' + Number(v||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        const totalCobrado = registro.total || 0;
        const totalPagado = (registro.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
        const saldo = Math.max(0, totalCobrado - totalPagado);

        const noches = registro.fechaEntrada && registro.fechaSalida
            ? Math.max(1, Math.round((new Date(registro.fechaSalida) - new Date(registro.fechaEntrada)) / (1000 * 60 * 60 * 24)))
            : null;
        const numPersonas = Array.isArray(registro.huespedes) ? (registro.huespedes.filter(Boolean).length || 1) : 1;

        const hotelNombre = config?.nombre || 'Hotel Balcón';
        const telefono = config?.telefono || '';
        const sitioWeb = config?.sitioWeb || '';
        const politicas = config?.politicasBienvenida || config?.politica || '';
        const datosAdicionales = config?.datosAdicionalesCheckin || '';
        const wifiNombre = config?.wifiNombre || '';
        const wifiLineas = [
            config?.wifiClave1 ? `  • Piso 1: *${config.wifiClave1}*` : '',
            config?.wifiClave2 ? `  • Piso 2: *${config.wifiClave2}*` : '',
            config?.wifiClave3 ? `  • Piso 3: *${config.wifiClave3}*` : '',
            config?.wifiClave4 ? `  • Piso 4: *${config.wifiClave4}*` : '',
        ].filter(Boolean);

        const sep = `━━━━━━━━━━━━━━━━━━━━━━`;

        let mensaje = `🏨 *${hotelNombre.toUpperCase()}*\n`;
        mensaje += `${sep}\n\n`;
        mensaje += `¡Bienvenido/a, *${registro.cliente?.nombre || 'Huésped'}*! 🙏\n\n`;
        mensaje += `Es un placer recibirle. Esperamos que su estadía sea cómoda, agradable y llena de gratos momentos.\n\n`;

        mensaje += `${sep}\n`;
        mensaje += `📋 *DATOS DE SU ESTADÍA*\n`;
        mensaje += `${sep}\n`;
        mensaje += `🛏️  Habitación: *${registro.habitacion?.numero || '–'}*\n`;
        mensaje += `📅  Check-in: *${fmt(registro.fechaEntrada)}*\n`;
        mensaje += `📅  Check-out: *${fmt(registro.fechaSalida)}*\n`;
        if (noches) mensaje += `🌙  Noches: *${noches}*\n`;
        mensaje += `👥  Huéspedes: *${numPersonas}*\n\n`;

        mensaje += `${sep}\n`;
        mensaje += `💰 *RESUMEN FINANCIERO*\n`;
        mensaje += `${sep}\n`;
        mensaje += `💵  Total: *${fmtCop(totalCobrado)}*\n`;
        mensaje += `✅  Abono recibido: *${fmtCop(totalPagado)}*\n`;
        mensaje += `⏳  Saldo pendiente: *${fmtCop(saldo)}*\n\n`;

        if (wifiNombre || wifiLineas.length > 0) {
            mensaje += `${sep}\n`;
            mensaje += `📶 *ACCESO WIFI*\n`;
            mensaje += `${sep}\n`;
            if (wifiNombre) mensaje += `📡  Red: *${wifiNombre}*\n`;
            if (wifiLineas.length > 0) mensaje += `🔐  Contraseñas:\n${wifiLineas.join('\n')}\n`;
            mensaje += `\n`;
        }

        if (datosAdicionales) {
            mensaje += `${sep}\n`;
            mensaje += `ℹ️  *INFORMACIÓN DE INTERÉS*\n`;
            mensaje += `${sep}\n`;
            mensaje += `${datosAdicionales}\n\n`;
        }

        if (politicas) {
            mensaje += `${sep}\n`;
            mensaje += `📌 *POLÍTICAS DEL HOTEL*\n`;
            mensaje += `${sep}\n`;
            mensaje += `${politicas}\n\n`;
        }

        mensaje += `${sep}\n`;
        mensaje += `Estamos a su disposición para lo que necesite. ¡Que lo disfrute! 🌟\n`;
        if (telefono) mensaje += `📞 *${telefono}*`;
        if (sitioWeb) mensaje += ` | 🌐 *${sitioWeb}*`;

        const telefonoCliente = (registro.cliente?.telefono || '').replace(/\D/g, '');
        const whatsappUrl = telefonoCliente
            ? `https://wa.me/57${telefonoCliente}?text=${encodeURIComponent(mensaje)}`
            : null;

        res.json({ mensaje, whatsappUrl, telefono: telefonoCliente, activo: true });
    } catch (err) {
        console.error('[GET-WA-LINK ERROR]', err);
        res.status(500).json({ message: 'Error interno al generar link de WhatsApp', error: err.message });
    }
};
