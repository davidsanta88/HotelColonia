const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

const Reserva = require('c:/Users/USUARIO/Documents/Empresa/Hotel/backend/models/Reserva');
const Habitacion = require('c:/Users/USUARIO/Documents/Empresa/Hotel/backend/models/Habitacion');

async function migrate() {
    try {
        await mongoose.connect(URI);
        console.log('Conectado a MongoDB');

        const reservas = await Reserva.find();
        console.log(`Procesando ${reservas.length} reservas...`);

        for (const r of reservas) {
            let changed = false;

            // 1. Migrar fechas
            if (!r.fecha_entrada && r.fechaInicio) {
                r.fecha_entrada = r.fechaInicio;
                changed = true;
            }
            if (!r.fecha_salida && r.fechaFin) {
                r.fecha_salida = r.fechaFin;
                changed = true;
            }

            // 2. Migrar habitación única a array
            if ((!r.habitaciones || r.habitaciones.length === 0) && r.habitacion) {
                const hab = await Habitacion.findById(r.habitacion);
                r.habitaciones = [{
                    habitacion: r.habitacion,
                    numero: hab ? hab.numero : '',
                    precio_acordado: (hab ? hab.precio_1 : 0) || 0
                }];
                changed = true;
            }

            if (changed) {
                await r.save();
                console.log(`Reserva ${r._id} actualizada.`);
            }
        }

        console.log('Migración de datos de reservas completada.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error en migración:', err);
    }
}

migrate();
