const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const PLAZA_URI = process.env.PLAZA_MONGODB_URI || 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';

async function checkManualIncomes() {
    try {
        const conn = await mongoose.createConnection(PLAZA_URI).asPromise();
        const Gasto = conn.model('Gasto', new mongoose.Schema({}, { strict: false }));
        const CategoriaGasto = conn.model('CategoriaGasto', new mongoose.Schema({}, { strict: false }));
        
        const categories = await CategoriaGasto.find({ tipo: 'Ingreso' });
        console.log('Ingreso Categories:', categories.map(c => c.nombre));

        const tiendaCat = categories.find(c => c.nombre.toLowerCase().includes('tienda'));
        if (tiendaCat) {
            const count = await Gasto.countDocuments({ categoria: tiendaCat._id });
            console.log(`Manual Incomes for Tienda category (${tiendaCat.nombre}):`, count);
        } else {
            console.log('No "Tienda" income category found.');
        }

        await conn.close();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkManualIncomes();
