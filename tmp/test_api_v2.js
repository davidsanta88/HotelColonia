const mongoose = require('mongoose');
const Reserva = require('c:/Users/USUARIO/Documents/Empresa/Hotel/backend/models/Reserva');
const Habitacion = require('c:/Users/USUARIO/Documents/Empresa/Hotel/backend/models/Habitacion');
const Cliente = require('c:/Users/USUARIO/Documents/Empresa/Hotel/backend/models/Cliente');
require('dotenv').config({ path: 'c:/Users/USUARIO/Documents/Empresa/Hotel/backend/.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const reservas = await Reserva.find()
            .populate('cliente')
            .populate('habitacion')
            .populate('habitaciones.habitacion');

        console.log(`Found ${reservas.length} reservations`);

        if (reservas.length > 0) {
            const r = reservas[0];
            const obj = r.toObject({ virtuals: true });
            
            // Apply controller logic for formatting
            if ((!obj.habitaciones || obj.habitaciones.length === 0) && obj.habitacion) {
                obj.habitaciones = [{
                    habitacion: obj.habitacion,
                    numero: obj.habitacion.numero,
                    precio_acordado: obj.habitacion.precio_1 || 0
                }];
            }

            console.log('--- Sample Reservation ---');
            console.log('ID:', obj.id);
            console.log('Cliente Nombre:', obj.cliente_nombre);
            console.log('Identificacion:', obj.identificacion);
            console.log('Habitaciones:', JSON.stringify(obj.habitaciones, null, 2));
            console.log('Fecha Entrada:', obj.fecha_entrada);
            console.log('Fecha Salida:', obj.fecha_salida);
            
            if (!obj.fecha_entrada && obj.fechaInicio) {
                console.log('WARNING: fecha_entrada is missing but fechaInicio exists. Data needs migration.');
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
