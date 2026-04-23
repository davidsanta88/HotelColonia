const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sharedUri = process.env.SHARED_MONGODB_URI;

if (!sharedUri) {
    console.error('ERROR: SHARED_MONGODB_URI no definida en .env');
}

const sharedConn = mongoose.createConnection(sharedUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

sharedConn.on('connected', () => {
    console.log('>>> Conexión Compartida (Clientes/Empresas) Establecida');
});

sharedConn.on('error', (err) => {
    console.error('>>> Error en Conexión Compartida:', err);
});

module.exports = sharedConn;
