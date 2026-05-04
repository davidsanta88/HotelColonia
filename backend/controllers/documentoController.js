const DocumentoHotel = require('../models/DocumentoHotel');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const streamUpload = (buffer, originalName = '') => {
    return new Promise((resolve, reject) => {
        const fileExt = path.extname(originalName).toLowerCase();
        const fileName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '_');

        // Todos los documentos se suben como 'raw' para servirse como archivo original
        const options = {
            folder: 'documentos_hotel',
            resource_type: 'raw',
            type: 'upload',
            public_id: `${fileName}_${Date.now()}${fileExt}`
        };

        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

exports.getDocumentos = async (req, res) => {
    try {
        const documentos = await DocumentoHotel.find().sort({ createdAt: -1 });
        res.json(documentos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener documentos', error: error.message });
    }
};

exports.uploadDocumento = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const { nombre, tipo, observacion, entidad_id } = req.body;
        
        // PDFs se tratan como imágenes en Cloudinary para permitir fl_attachment si se requiere luego
        const result = await streamUpload(req.file.buffer, req.file.originalname);

        const nuevoDoc = new DocumentoHotel({
            nombre: nombre || req.file.originalname,
            tipo: tipo || 'OTRO',
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            version: result.version,
            entidad_id: entidad_id,
            observacion
        });

        await nuevoDoc.save();
        res.status(201).json(nuevoDoc);
    } catch (error) {
        res.status(500).json({ message: 'Error al subir el documento', error: error.message });
    }
};

exports.downloadDocumento = async (req, res) => {
    try {
        const doc = await DocumentoHotel.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        let downloadUrl;

        if (doc.public_id) {
            const resourceType = doc.resource_type || (doc.url.includes('/raw/') ? 'raw' : 'image');
            // URL firmada — funciona aunque Cloudinary tenga acceso restringido
            downloadUrl = cloudinary.url(doc.public_id, {
                resource_type: resourceType,
                sign_url: true,
                attachment: true,
                secure: true,
                type: 'upload'
            });
        } else {
            // Fallback para documentos sin public_id
            downloadUrl = doc.url;
        }

        return res.json({ url: downloadUrl, nombre: doc.nombre });

    } catch (error) {
        console.error('[DOWNLOAD] Error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de documento inválido' });
        }
        res.status(500).json({ message: 'Error al procesar la descarga' });
    }
};

exports.deleteDocumento = async (req, res) => {
    try {
        const doc = await DocumentoHotel.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        // Intentar eliminar de Cloudinary
        let publicId = doc.public_id;
        let resourceType = doc.resource_type || 'image';

        if (!publicId) {
            // Fallback: extraer de la URL
            const urlParts = doc.url.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1) {
                const hasVersion = urlParts[uploadIndex + 1] && urlParts[uploadIndex + 1].startsWith('v');
                publicId = urlParts.slice(uploadIndex + (hasVersion ? 2 : 1)).join('/');
                // Quitar la extensión para el destroy
                if (publicId.includes('.')) {
                    publicId = publicId.substring(0, publicId.lastIndexOf('.'));
                }
                resourceType = urlParts[uploadIndex - 1];
            }
        }

        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (err) {
                console.error('[CLOUDINARY] Error deleting file:', err.message);
                // Continuamos con la eliminación en DB incluso si falla en Cloudinary
            }
        }

        await DocumentoHotel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el documento', error: error.message });
    }
};
