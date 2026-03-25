import axios from 'axios';

// Proxy normal para JSON (Vercel procesa el body automáticamente)
export default async function handler(req, res) {
    const { path } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // URL Forzada del backend
    const baseUrl = 'http://hbalconplaza-001-site1.site4future.com';
    const cleanPath = path.replace(/^\/?api\//, '');
    const targetUrl = `${baseUrl}/api/${cleanPath}`;

    try {
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'content-type': req.headers['content-type'] || 'application/json',
                'accept': req.headers['accept'] || '*/*',
            },
            data: req.body,
            validateStatus: () => true 
        };

        // Pasar el token de autorización si existe
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        const response = await axios(axiosConfig);
        
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        res.setHeader('X-Proxy-Target', targetUrl);
        res.setHeader('X-Proxy-Type', 'JSON');

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy JSON Error:', error.message);
        return res.status(500).json({ 
            error: 'Error en el túnel de conexión JSON', 
            targetUrl,
            details: error.message 
        });
    }
}
