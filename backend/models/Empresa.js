const sharedConn = require('../config/sharedConn');

const empresaSchema = new mongoose.Schema({
    razon_social: { type: String, required: true },
    nit: { type: String, required: true, unique: true },
    direccion: String,
    telefono: String,
    email: String,
    observacion: String,
    fechaCreacion: { type: Date, default: Date.now },
    usuarioCreacion: String,
    usuarioModificacion: String,
    fechaModificacion: Date
});

module.exports = sharedConn.model('Empresa', empresaSchema);
