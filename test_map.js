const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./backend/config/db');

// Require ALL models to ensure they are registered
require('./backend/models/Habitacion');
require('./backend/models/Registro');
require('./backend/models/Reserva');
require('./backend/models/Cliente');
require('./backend/models/TipoHabitacion');
require('./backend/models/EstadoHabitacion');
require('./backend/models/Venta');

const Habitacion = mongoose.model('Habitacion');
const Registro = mongoose.model('Registro');
const Reserva = mongoose.model('Reserva');

async function test() {
    await connectDB();
    console.log('Connected to DB');
    
    try {
        const [habitaciones, registrosActivos, todasReservas] = await Promise.all([
            Habitacion.find().limit(1).populate('tipo').populate('estado'),
            Registro.find({ estado: 'activo' }).limit(1).populate('cliente'),
            Reserva.find().limit(1).populate('cliente')
        ]);
        console.log('Loaded data successfully');
        console.log('Habitacion 0:', habitaciones[0]?.numero);
        console.log('Registro 0 client:', registrosActivos[0]?.cliente?.nombre);
        process.exit(0);
    } catch (err) {
        console.error('Error loading data:', err);
        process.exit(1);
    }
}

test();
