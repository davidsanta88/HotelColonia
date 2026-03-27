const Municipio = require('../models/Municipio');

exports.getMunicipios = async (req, res) => {
    try {
        // Asegurar que todos tengan visualizar en true como pidió el usuario
        await Municipio.updateMany({ visualizar: false }, { visualizar: true });
        const municipios = await Municipio.find().sort({ nombre: 1 });
        res.json(municipios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicMunicipios = async (req, res) => {
    try {
        const municipios = await Municipio.find({ visualizar: true }).sort({ nombre: 1 });
        res.json(municipios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMunicipio = async (req, res) => {
    try {
        const newMun = new Municipio(req.body);
        await newMun.save();
        res.status(201).json(newMun);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        if (payload.nombre) {
            payload.nombre = payload.nombre.toUpperCase();
        }
        const updated = await Municipio.findByIdAndUpdate(id, payload, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        await Municipio.findByIdAndDelete(id);
        res.json({ message: 'Municipio eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Emergency Re-seed Trigger
exports.reseed = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const rawPath = path.join(__dirname, '../municipios_raw.txt');
        const rawData = fs.readFileSync(rawPath, 'utf8');
        
        const docs = rawData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split('-');
                return {
                    nombre: line.trim(),
                    departamento: parts[0].trim(),
                    visualizar: true
                };
            })
            .filter(d => d.nombre && d.departamento);

        await Municipio.deleteMany({});
        await Municipio.insertMany(docs);
        
        res.json({ message: 'Re-seed completed', count: docs.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
