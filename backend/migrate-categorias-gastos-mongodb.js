const mongoose = require('mongoose');
const CategoriaGasto = require('./models/CategoriaGasto');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Actualizar todas las categorías que no tengan el campo 'activo' o 'tipo'
        const result = await CategoriaGasto.updateMany(
            { $or: [{ activo: { $exists: false } }, { tipo: { $exists: false } }] },
            { $set: { activo: true, tipo: 'Gasto' } }
        );

        console.log(`Migración completada. Documentos actualizados: ${result.modifiedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
};

migrate();
