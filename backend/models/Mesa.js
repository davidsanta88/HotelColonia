const mongoose = require('mongoose');

const mesaSchema = new mongoose.Schema({
    numero: { type: Number, required: true, unique: true },
    estado: { 
        type: String, 
        enum: ['Disponible', 'Ocupada', 'Reservada', 'En Limpieza'], 
        default: 'Disponible' 
    },
    capacidad: { type: Number, default: 4 },
    ubicacion: { type: String, default: 'Interior' }, // Interior, Terraza, Balcón
    comandaActiva: { type: mongoose.Schema.Types.ObjectId, ref: 'Comanda' },
    fechaActualizacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mesa', mesaSchema);

