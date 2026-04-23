const mongoose = require('mongoose');
require('dotenv').config();

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
