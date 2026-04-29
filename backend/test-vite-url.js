const https = require('http'); // Site4future might be http

function get(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? require('https') : require('http');
        client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON: ' + data.substring(0, 100)));
                }
            });
        }).on('error', reject);
    });
}

async function testViteUrl() {
    const url = 'http://hbalconplaza-001-site1.site4future.com/api/hotel-config';
    try {
        console.log(`Testing VITE_API_URL: ${url}`);
        const data = await get(url);
        console.log(`Response:`, data.nombre || 'No name found');
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

testViteUrl();

