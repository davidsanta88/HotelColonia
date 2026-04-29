const mongoose = require('mongoose');
const URI = 'mongodb+srv://adminhotel:hotel2026@cluster0.zsiq9ye.mongodb.net/HotelDB?retryWrites=true&w=majority';
mongoose.connect(URI).then(async () => {
    const db = mongoose.connection.db;
    const config = await db.collection('hotelconfigs').findOne({});
    console.log('Hotel Config:', JSON.stringify(config, null, 2));
    
    const countHab = await db.collection('habitacions').countDocuments();
    console.log('Total Habitaciones:', countHab);

    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

