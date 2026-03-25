const mongoose = require('mongoose');

const passwords = ['hotel2026', 'admin2026', 'Admin2026', 'K0l0mbia2026*', 'Hotel2026*', 'adminhotel2026'];
const user = 'adminhotel';
const cluster = 'cluster0.pb5rtli.mongodb.net';
const dbName = 'HotelDB';

async function crack() {
    for (const pass of passwords) {
        const URI = `mongodb+srv://${user}:${pass}@${cluster}/${dbName}?retryWrites=true&w=majority`;
        console.log(`Testing password: ${pass}...`);
        try {
            await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
            console.log(`--- SUCCESS! Password is: ${pass} ---`);
            const db = mongoose.connection.db;
            const count = await db.collection('municipios').countDocuments();
            console.log(`Municipios in Pb5rtli: ${count}`);
            await mongoose.disconnect();
            process.exit(0);
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
    }
    console.log('None of the common passwords worked.');
    process.exit(1);
}

crack();
