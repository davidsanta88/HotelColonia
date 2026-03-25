import axios from 'axios';

// Desactivar bodyParser para permitir pasar el stream del request de archivos sin corromperlo
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
    let { path } = req.query;
    if (!path) return res.status(400).json({ error: 'Ruta no especificada' });

    const baseUrl = 'http://hbalconplaza-001-site1.site4future.com';
    const cleanPath = path.replace(/^\/?api\//, '');
    const targetUrl = `${baseUrl}/api/${cleanPath}`;

    try {
        const body = await getRawBody(req);
        
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                'content-type': req.headers['content-type'],
                'accept': req.headers['accept'] || '*/*',
            },
            data: body,
            responseType: 'arraybuffer',
            validateStatus: () => true,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        };

        if (req.headers.authorization) {
            axiosConfig.headers['x-auth-token'] = req.headers.authorization;
        }

        const response = await axios(axiosConfig);
        
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        res.setHeader('X-Proxy-Target', targetUrl);
        res.setHeader('X-Proxy-Type', 'Upload');

        return res.status(response.status).send(Buffer.from(response.data));

    } catch (error) {
        console.error('Proxy Upload Error:', error.message);
        return res.status(500).json({ error: 'Proxy Upload Error', details: error.message, targetUrl });
    }
}
