const axios = require('axios');

async function testEndpoints() {
    const urls = [
        { name: 'Colonial (Octopus)', url: 'https://octopus-app-omxcu.ondigitalocean.app/api/hotel-config' },
        { name: 'Plaza (Whale)', url: 'https://whale-app-c75fy.ondigitalocean.app/api/hotel-config' }
    ];

    for (const item of urls) {
        try {
            console.log(`Testing ${item.name}...`);
            const res = await axios.get(item.url);
            console.log(`Response from ${item.name}:`, res.data.nombre || 'No name found');
        } catch (e) {
            console.error(`Error testing ${item.name}:`, e.message);
        }
    }
}

testEndpoints();
