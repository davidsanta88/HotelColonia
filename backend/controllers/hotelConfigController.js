const HotelConfig = require('../models/HotelConfig');
const cloudinary = require('../config/cloudinary');

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
