const mongoose = require('mongoose');

const EncuestaSchema = new mongoose.Schema({
    registro_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro' },
    habitacion_numero: String,
    huesped_nombre: String,
    hotel: String,
    token: { type: String, unique: true, required: true },
    completada: { type: Boolean, default: false },
    calificacion_general: { type: Number, min: 1, max: 5 },
    calificacion_limpieza: { type: Number, min: 1, max: 5 },
    calificacion_atencion: { type: Number, min: 1, max: 5 },
    calificacion_instalaciones: { type: Number, min: 1, max: 5 },
    recomendaria: { type: Boolean },
    comentario: { type: String },
    fecha_completada: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Encuesta', EncuestaSchema);
