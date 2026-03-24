const url = 'http://hbalconplaza-001-site1.site4future.com/api/auth/login';
const authHeader = 'Basic MTEzMDA5MTY6NjAtZGF5ZnJlZXRyaWFs';

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ correo: 'admin@hotel.com', password: '1' }) // Dummy payload to trigger response
}).then(async res => {
  console.log('Status:', res.status);
  console.log('Text:', await res.text());
}).catch(console.error);
