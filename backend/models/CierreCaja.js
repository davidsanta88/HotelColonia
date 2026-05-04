const mongoose = require('mongoose');

const cierreCajaSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    ingresos: { type: Number, required: true },
    egresos: { type: Number, required: true },
    saldo_calculado: { type: Number, required: true },
    saldo_real: { type: Number },       // Efectivo físico que queda en caja
    efectivo_retirado: { type: Number, default: 0 }, // Efectivo recogido/retirado del día
    diferencia: { type: Number },
    nota: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    usuario_nombre: String,
    medios_pago: {
        nequi: Number,
        bancolombia: Number,
        efectivo: Number,
        otros: Number
    },
    verificacion_bancos: {
        nequi_real: { type: Number, default: null },
        bancolombia_real: { type: Number, default: null },
        diferencia_nequi: { type: Number, default: 0 },
        diferencia_bancolombia: { type: Number, default: 0 },
        verificado: { type: Boolean, default: false }
    }
});

module.exports = mongoose.model('CierreCaja', cierreCajaSchema);
