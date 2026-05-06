const HotelConfig = require('../models/HotelConfig');
const cloudinary = require('../config/cloudinary');
const Registro = require('../models/Registro');

// Helper para Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'hotel-plaza/config' },
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
            .populate('habitacion', 'numero')
            .populate('cliente', 'nombre telefono')
            .lean();

        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        const fmt = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bogota' }) : '–';
        const fmtCop = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`;

        const totalCobrado = registro.total || 0;
        const totalPagado = (registro.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
        const saldo = Math.max(0, totalCobrado - totalPagado);

        const hotelNombre = config?.nombre || 'Hotel Balcón';
        const sitioWeb = config?.sitioWeb || '';
        const politicas = config?.politicasBienvenida || config?.politica || '';
        const wifiNombre = config?.wifiNombre || '';
        const wifiLineas = [
            config?.wifiClave1 ? `  • Piso 1: *${config.wifiClave1}*` : '',
            config?.wifiClave2 ? `  • Piso 2: *${config.wifiClave2}*` : '',
            config?.wifiClave3 ? `  • Piso 3: *${config.wifiClave3}*` : '',
            config?.wifiClave4 ? `  • Piso 4: *${config.wifiClave4}*` : '',
        ].filter(Boolean);

        let mensaje = `🏨 *${hotelNombre.toUpperCase()}*\n`;
        mensaje += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        mensaje += `¡Bienvenido/a, *${registro.cliente?.nombre || 'Huésped'}*! 🎉\n\n`;
        mensaje += `Estamos muy contentos de recibirle. Le deseamos una estadía cómoda y placentera.\n\n`;
        mensaje += `📋 *DATOS DE SU REGISTRO*\n`;
        mensaje += `─────────────────────\n`;
        mensaje += `🛏️ Habitación: *${registro.habitacion?.numero || '–'}*\n`;
        mensaje += `📅 Ingreso: *${fmt(registro.fechaEntrada)}*\n`;
        mensaje += `📅 Salida programada: *${fmt(registro.fechaSalida)}*\n\n`;
        mensaje += `💰 *RESUMEN FINANCIERO*\n`;
        mensaje += `─────────────────────\n`;
        mensaje += `Total cobrado: *${fmtCop(totalCobrado)}*\n`;
        mensaje += `Total pagado: *${fmtCop(totalPagado)}*\n`;
        mensaje += `Saldo pendiente: *${fmtCop(saldo)}*\n\n`;

        if (wifiNombre || wifiLineas.length > 0) {
            mensaje += `📶 *ACCESO WIFI*\n`;
            mensaje += `─────────────────────\n`;
            if (wifiNombre) mensaje += `Red: *${wifiNombre}*\n`;
            if (wifiLineas.length > 0) mensaje += `Contraseñas:\n${wifiLineas.join('\n')}\n`;
            mensaje += `\n`;
        }

        if (politicas) {
            mensaje += `📌 *POLÍTICAS DEL HOTEL*\n`;
            mensaje += `─────────────────────\n`;
            mensaje += `${politicas}\n\n`;
        }

        if (sitioWeb) {
            mensaje += `🌐 *SÍGUENOS*\n`;
            mensaje += `─────────────────────\n`;
            mensaje += `${sitioWeb}\n\n`;
        }

        mensaje += `¡Gracias por elegirnos! Cualquier inquietud, estamos a su disposición. 🙏`;

        const telefono = (registro.cliente?.telefono || '').replace(/\D/g, '');
        const whatsappUrl = telefono
            ? `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
            : null;

        res.json({ mensaje, whatsappUrl, telefono, activo: config?.mensajeBienvenidaActivo !== false });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
