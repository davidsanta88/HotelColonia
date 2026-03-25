import axios from 'axios';

// Desactivar bodyParser para manejar el flujo manualmente y no corromper archivos
export const config = {
  api: {
    bodyParser: false,
  },
};

// Utilidad para leer el cuerpo de la petición como un Buffer crudo
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    let { path, isUpload } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // URL Forzada del backend para evitar redirecciones a DigitalOcean
    const baseUrl = 'http://hbalconplaza-001-site1.site4future.com';
    const cleanPath = path.replace(/^\/?api\//, '');
    const targetUrl = cleanPath.startsWith('uploads') 
        ? `${baseUrl}/${cleanPath}` 
        : `${baseUrl}/api/${cleanPath}`;

    try {
        // Leer el cuerpo original antes de enviarlo
        const body = await getRawBody(req);
        
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'content-type': req.headers['content-type'] || 'application/json',
                'accept': req.headers['accept'] || '*/*',
            },
            data: body,
            responseType: isUpload ? 'arraybuffer' : 'json',
            validateStatus: () => true,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        };

        // Pasar el token de autorización si existe (mapeado a x-auth-token que espera el backend)
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        const response = await axios(axiosConfig);
        
        // Copiar encabezados de respuesta relevantes
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        res.setHeader('X-Proxy-Target', targetUrl);

        if (isUpload || (response.headers['content-type'] && response.headers['content-type'].includes('image'))) {
            return res.status(response.status).send(Buffer.from(response.data));
        }

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ 
            error: 'Error en el túnel de conexión', 
            targetUrl,
            details: error.message 
        });
    }
}
