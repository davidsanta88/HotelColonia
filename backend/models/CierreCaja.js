const mongoose = require('mongoose');

const cierreCajaSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    ingresos: { type: Number, required: true },
    egresos: { type: Number, required: true },
    saldo_calculado: { type: Number, required: true },
    saldo_real: { type: Number }, // Opcional, por si quieren ingresar monto fisico
    diferencia: { type: Number },
    nota: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    usuario_nombre: String,
    medios_pago: {
        nequi: Number,
        bancolombia: Number,
        efectivo: Number,
        otros: Number
    }
});

module.exports = mongoose.model('CierreCaja', cierreCajaSchema);

