const mongoose = require('mongoose');

const preciosDiaSchema = {
    personas_1: { type: Number, default: 0 },
    personas_2: { type: Number, default: 0 },
    personas_3: { type: Number, default: 0 },
    personas_4: { type: Number, default: 0 },
    personas_5: { type: Number, default: 0 },
    personas_6: { type: Number, default: 0 },
};

const TarifaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },          // "Sencilla", "Doble", "Suite"...
    tipo_habitacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoHabitacion' },
    color: { type: String, default: '#4f46e5' },
    activo: { type: Boolean, default: true },
    entre_semana: preciosDiaSchema,   // Lunes - Viernes
    fin_de_semana: preciosDiaSchema,  // Sábado - Domingo
    festivo: preciosDiaSchema,        // Días festivos
    notas: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Tarifa', TarifaSchema);
