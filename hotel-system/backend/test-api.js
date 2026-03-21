const http = require('http');

const body = JSON.stringify({ email: 'admin@hotel.com', password: 'admin' });

const reqAuth = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
}, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        const { token } = JSON.parse(raw);
        if(!token) { console.error("No token!"); process.exit(1); }
        
        http.get('http://localhost:5000/api/registros/1', {
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res2) => {
            let data2 = '';
            res2.on('data', c => data2 += c);
            res2.on('end', () => {
                console.log("STATUS:", res2.statusCode);
                console.log("BODY:", data2);
            });
        });
    });
});

reqAuth.write(body);
reqAuth.end();
