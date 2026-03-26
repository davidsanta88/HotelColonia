const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    prioridad: { type: String, enum: ['Normal', 'Alta', 'Urgente'], default: 'Normal' },
    fechaAlerta: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // Creador
    usuarioDestino: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }, // Null = Todos
    leida: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nota', notaSchema);
