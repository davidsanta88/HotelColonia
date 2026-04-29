const https = require('https');

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
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

async function testEndpoints() {
    const urls = [
        { name: 'Colonial (Octopus)', url: 'https://octopus-app-omxcu.ondigitalocean.app/api/hotel-config' },
        { name: 'Plaza (Whale)', url: 'https://whale-app-c75fy.ondigitalocean.app/api/hotel-config' }
    ];

    for (const item of urls) {
        try {
            console.log(`Testing ${item.name}...`);
            const data = await get(item.url);
            console.log(`Response from ${item.name}:`, data.nombre || 'No name found');
        } catch (e) {
            console.error(`Error testing ${item.name}:`, e.message);
        }
    }
}

testEndpoints();

