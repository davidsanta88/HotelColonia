async function testTrack() {
    try {
        console.log('--- TEST TRACKING ---');
        const res = await fetch('http://localhost:5000/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '181.128.1.1' // Un IP de Bogotá, Colombia
            },
            body: JSON.stringify({
                path: '/test-verification',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testTrack();
