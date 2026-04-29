const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
mongoose.connect(URI).then(async () => {
    const db = mongoose.connection.db;
    const usuarios = await db.collection('usuarios').find({}).toArray();
    console.log('Usuarios Plaza:', usuarios.map(u => u.nombre));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

