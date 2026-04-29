const mongoose = require('mongoose');

const categoriaGastoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    tipo: { type: String, enum: ['Gasto', 'Ingreso'], default: 'Gasto' },
    activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CategoriaGasto', categoriaGastoSchema);

