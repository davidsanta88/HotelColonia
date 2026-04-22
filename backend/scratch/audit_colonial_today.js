const mongoose = require('mongoose');
const URI = 'mongodb+srv://admin:HotelColonial2026@cluster0.d1nbr5v.mongodb.net/HotelColonialDB?retryWrites=true&w=majority';

async function audit() {
    await mongoose.connect(URI);
    
    const Registro = mongoose.model('Registro', new mongoose.Schema({ pagos: [{ monto: Number, fecha: Date }] }));
    const Venta = mongoose.model('Venta', new mongoose.Schema({ total: Number, fecha: Date }));
    const Gasto = mongoose.model('Gasto', new mongoose.Schema({ monto: Number, fecha: Date, categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaGasto' } }));
    const Categoria = mongoose.model('CategoriaGasto', new mongoose.Schema({ tipo: String }));

    const start = new Date('2026-04-22T00:00:00Z');
    const end = new Date('2026-04-22T23:59:59Z');

    console.log('--- AUDITORÍA COLONIAL (2026-04-22) ---');

    const regs = await Registro.aggregate([
        { $unwind: '$pagos' },
        { $match: { 'pagos.fecha': { $gte: start, $lte: end } } }
    ]);
    console.log('--- PAGOS REGISTROS ---');
    regs.forEach(r => console.log(`${r.pagos.monto} (${r.pagos.fecha})`));

    const vts = await Venta.find({ fecha: { $gte: start, $lte: end } });
    console.log('--- VENTAS TIENDA ---');
    vts.forEach(v => console.log(v.total));

    const gts = await Gasto.find({ fecha: { $gte: start, $lte: end } }).populate('categoria');
    console.log('--- INGRESOS MANUALES ---');
    gts.forEach(g => {
        if (g.categoria && g.categoria.tipo === 'Ingreso') {
            console.log(`${g.monto} (Categoría: ${g.categoria.nombre || 'N/A'})`);
        }
    });

    process.exit();
}

audit();
