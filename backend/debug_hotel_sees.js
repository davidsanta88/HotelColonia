const mongoose = require('mongoose');
require('dotenv').config();
const sharedUri = process.env.SHARED_MONGODB_URI;
const sharedConn = mongoose.createConnection(sharedUri);
const empresaSchema = new mongoose.Schema({ razon_social: String, nit: String });
const Empresa = sharedConn.model('Empresa', empresaSchema);
sharedConn.on('connected', async () => {
    const empresas = await Empresa.find();
    console.log(`Found ${empresas.length} empresas:`);
    empresas.forEach(e => console.log(`- ${e.razon_social} (${e.nit})`));
    process.exit(0);
});
