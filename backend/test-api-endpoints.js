const http = require('http');

async function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : null;
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    try {
        console.log('Testing API endpoints for POS...\n');

        // 1. Login
        console.log('Step 1: Logging in...');
        const loginRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'admin@hotel.com',
            password: 'admin'
        });

        if (loginRes.statusCode !== 200) {
            throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.data)}`);
        }

        const token = loginRes.data.token;
        console.log('Success: Token obtained.\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`
        };

        // 2. Test /api/productos
        console.log('Step 2: Testing /api/productos...');
        const resProd = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/productos',
            method: 'GET',
            headers: authHeaders
        });
        console.log(`Status: ${resProd.statusCode}`);
        if (resProd.statusCode === 200) console.log(`Success: Found ${resProd.data.length} productos`);
        else console.error('Error:', resProd.data);

        // 3. Test /api/medios-pago
        console.log('\nStep 3: Testing /api/medios-pago...');
        const resMP = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/medios-pago',
            method: 'GET',
            headers: authHeaders
        });
        console.log(`Status: ${resMP.statusCode}`);
        if (resMP.statusCode === 200) console.log(`Success: Found ${resMP.data.length} medios de pago`);
        else console.error('Error:', resMP.data);

        // 4. Test /api/registros/activos
        console.log('\nStep 4: Testing /api/registros/activos...');
        const resReg = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/registros/activos',
            method: 'GET',
            headers: authHeaders
        });
        console.log(`Status: ${resReg.statusCode}`);
        if (resReg.statusCode === 200) console.log(`Success: Found ${resReg.data.length} registros activos`);
        else console.error('Error:', resReg.data);

    } catch (err) {
        console.error('Major error:', err.message);
    }
}

test();

