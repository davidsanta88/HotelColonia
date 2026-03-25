const mongoose = require('mongoose');

const municipioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    departamento: String,
    codigo_dane: String,
    visualizar: { type: Boolean, default: false }
});

module.exports = mongoose.model('Municipio', municipioSchema);
