import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    const { path, isUpload } = req.query;
    
    if (!path) {
        return res.status(400).json({ error: 'Ruta no especificada' });
    }

    // URL DE DIGITAL OCEAN (Confirmada por el usuario como la actual)
    const baseUrl = 'https://whale-app-c75fy.ondigitalocean.app';
    
    // The original `path` from `req.query` is used to construct the base target path.
    // `req.url` includes the full path and query string from the client's request to this proxy.
    // We need to ensure the `/api/` prefix is maintained for the backend.
    // The `path` query parameter already represents the backend path, e.g., 'users/1'.
    // So, the target URL should be `${baseUrl}/api/${path}`.
    // Then, we append the timestamp to bypass caching.
    
    // Construct the base target URL using the 'path' query parameter
    let targetUrl = `${baseUrl}/api/${path}`;

    // Append the timestamp to bypass caching
    targetUrl += targetUrl.includes('?') ? '&' : '?';
    targetUrl += `v=${Date.now()}`;
    
    console.log(`Proxying ${req.method} to: ${targetUrl}`);

    try {
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            data: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
            validateStatus: () => true,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        };

        // Enviar el JWT que viene del cliente en el header 'x-auth-token' que espera el backend
        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        const response = await axios(axiosConfig);
        
        // Copiar encabezado de tipo de contenido
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        res.setHeader('X-Proxy-Target', targetUrl);

        if (isUpload || (response.headers['content-type'] && response.headers['content-type'].includes('image'))) {
             // Si es una imagen o se marcó como upload, devolver como Buffer
             const bufferResponse = await axios({
                 ...axiosConfig,
                 responseType: 'arraybuffer'
             });
             return res.status(bufferResponse.status).send(Buffer.from(bufferResponse.data));
        }

        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({ 
            error: 'Error de conexión con DigitalOcean', 
            details: error.message,
            targetUrl
        });
    }
}
