const Empresa = require('../models/Empresa');

exports.getEmpresas = async (req, res) => {
    try {
        const empresas = await Empresa.find().sort({ razon_social: 1 });
        res.json(empresas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEmpresaById = async (req, res) => {
    try {
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
        res.json(empresa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEmpresa = async (req, res) => {
    try {
        const { razon_social, nit, direccion, telefono, email, observacion } = req.body;
        
        const existing = await Empresa.findOne({ nit });
        if (existing) {
            return res.status(400).json({ message: `El NIT ${nit} ya está registrado a nombre de ${existing.razon_social}` });
        }

        const newEmpresa = new Empresa({
            razon_social: razon_social.toUpperCase(),
            nit,
            direccion,
            telefono,
            email,
            observacion,
            usuarioCreacion: req.userName || 'Sistema'
        });

        await newEmpresa.save();
        res.status(201).json({ message: 'Empresa creada con éxito', id: newEmpresa._id, empresa: newEmpresa });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEmpresa = async (req, res) => {
    try {
        const { razon_social, nit, direccion, telefono, email, observacion } = req.body;
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

        empresa.razon_social = razon_social.toUpperCase();
        empresa.nit = nit;
        empresa.direccion = direccion;
        empresa.telefono = telefono;
        empresa.email = email;
        empresa.observacion = observacion;
        empresa.usuarioModificacion = req.userName || 'Sistema';
        empresa.fechaModificacion = Date.now();

        await empresa.save();
        res.json({ message: 'Empresa actualizada con éxito', empresa });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEmpresa = async (req, res) => {
    try {
        const Cliente = require('../models/Cliente');
        const hasClients = await Cliente.findOne({ empresa_id: req.params.id });
        if (hasClients) {
            return res.status(400).json({ message: 'No se puede eliminar la empresa porque tiene clientes vinculados' });
        }

        await Empresa.findByIdAndDelete(req.params.id);
        res.json({ message: 'Empresa eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
