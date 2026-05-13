const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, required: true },
    turno: { type: String, enum: ['Mañana', 'Tarde', 'Noche', 'Completo', 'Descanso'], required: true },
    horaInicio: { type: String, default: '' },
    horaFin: { type: String, default: '' },
    notas: { type: String, default: '' },
    creadoPor: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Turno', turnoSchema);
