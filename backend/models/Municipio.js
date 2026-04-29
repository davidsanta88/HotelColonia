const mongoose = require('mongoose');
const sharedConn = require('../config/sharedConn');

const municipioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    departamento: String,
    codigo_dane: String,
    visualizar: { type: Boolean, default: false }
});

module.exports = sharedConn.model('Municipio', municipioSchema);

