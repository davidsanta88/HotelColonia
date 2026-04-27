const mongoose = require('mongoose');

const detalleComandaSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    nombre: String,
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    notas: String, // Ejemplo: "Sin cebolla", "Término medio"
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Preparando', 'Entregado', 'Cancelado'], 
        default: 'Pendiente' 
    },
    fechaPedido: { type: Date, default: Date.now }
}, { _id: false });

const comandaSchema = new mongoose.Schema({
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa' },
    mesaNumero: Number,
    registro: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro' }, // Para cargo a habitación
    huespedNombre: String,
    items: [detalleComandaSchema],
    total: { type: Number, default: 0 },
    estado: { 
        type: String, 
        enum: ['Abierta', 'Cerrada', 'Pagada', 'Anulada'], 
        default: 'Abierta' 
    },
    fechaApertura: { type: Date, default: Date.now },
    fechaCierre: Date,
    mesero: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    notasGenerales: String
});

module.exports = mongoose.model('Comanda', comandaSchema);
