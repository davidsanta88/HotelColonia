const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    // Support multiple rooms (frontend expects this)
    habitaciones: [{
        habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitacion' },
        numero: String, // Calculated/Cached for easier access
        precio_acordado: Number
    }],
    // Keep single habitacion for backward compatibility or simple cases
    habitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Habitacion' },
    
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    
    // Use names that match frontend expectations
    fecha_entrada: Date,
    fecha_salida: Date,
    
    // Keep old names as aliases if needed, but primary are above
    fechaInicio: Date,
    fechaFin: Date,
    
    numero_personas: { type: Number, default: 1 },
    valor_total: { type: Number, default: 0 },
    valor_abonado: { type: Number, default: 0 },
    
    estado: { type: String, enum: ['Pendiente', 'Confirmada', 'Cancelada', 'Concluida'], default: 'Confirmada' },
    
    abonos: [{
        monto: Number,
        medio_pago: String,
        notas: String,
        usuario_nombre: String,
        fecha: { type: Date, default: Date.now }
    }],
    observaciones: String,
    usuarioCreacion: String,
    fechaCreacion: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for client name to satisfy frontend r.cliente_nombre
reservaSchema.virtual('cliente_nombre').get(function() {
    if (!this.cliente) return 'Desconocido';
    return this.cliente.nombre || 'Desconocido';
});

// Virtual for client document to satisfy frontend r.identificacion / r.documento
reservaSchema.virtual('identificacion').get(function() {
    if (!this.cliente) return '';
    return this.cliente.documento || '';
});

reservaSchema.virtual('documento').get(function() {
    if (!this.cliente) return '';
    return this.cliente.documento || '';
});

module.exports = mongoose.model('Reserva', reservaSchema);

