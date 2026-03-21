async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hotel.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;

        const res = await fetch('http://localhost:5000/api/clientes', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                nombre: 'Test Client',
                documento: '123456789',
                telefono: '555-1234',
                email: 'test@cliente.com'
            })
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (err) {
        console.error("Error creating client:", err.message);
    }
}
test();
