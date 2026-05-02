const mongoose = require('mongoose');

const PersonalRecurringSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true },
    monto: { type: Number, required: true },
    tipo: { type: String, enum: ['gasto', 'ingreso'], default: 'gasto' },
    categoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalCategory', required: true },
    frecuencia: { type: String, enum: ['mensual', 'quincenal', 'semanal'], default: 'mensual' },
    diaCobro: { type: Number, default: 1 }, // 1-31
    activo: { type: Boolean, default: true },
    descripcion: { type: String },
    ultimaEjecucion: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('PersonalRecurring', PersonalRecurringSchema);
