const Cliente = require('../models/Cliente');

exports.getClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().populate('municipio_origen_id', 'nombre');
        const mappedClientes = clientes.map(c => {
            const munObj = c.municipio_origen_id;
            return {
                id: c._id,
                nombre: c.nombre,
                documento: c.documentoNumero || c.documento,
                tipo_documento: c.documentoTipo || c.tipo_documento,
                telefono: c.telefono,
                email: c.email,
                municipio_origen_id: munObj ? (munObj._id || munObj) : null,
                municipio_nombre: munObj?.nombre || '-',
                UsuarioCreacion: c.usuarioCreacion,
                FechaCreacion: c.fechaCreacion,
                UsuarioModificacion: c.usuarioModificacion,
                FechaModificacion: c.fechaModificacion
            };
        });
        res.json(mappedClientes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCliente = async (req, res) => {
    try {
        const { nombre, documento, tipo_documento, telefono, email, municipio_origen_id } = req.body;
        
        const newCliente = new Cliente({
            nombre,
            documento,
            tipo_documento,
            telefono,
            email,
            municipio_origen_id: (municipio_origen_id === '' || !municipio_origen_id) ? null : municipio_origen_id,
            usuarioCreacion: req.userName || 'Sistema',
            fechaCreacion: Date.now()
        });

        await newCliente.save();
        res.status(201).json({ message: 'Cliente creado con éxito', id: newCliente._id });
    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, documento, tipo_documento, telefono, email, municipio_origen_id } = req.body;
        const cliente = await Cliente.findById(id);
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

        cliente.nombre = nombre;
        cliente.documento = documento;
        cliente.tipo_documento = tipo_documento;
        cliente.telefono = telefono;
        cliente.email = email;
        cliente.municipio_origen_id = (municipio_origen_id === '' || !municipio_origen_id) ? null : municipio_origen_id;
        cliente.usuarioModificacion = req.userName || 'Sistema';
        cliente.fechaModificacion = Date.now();

        await cliente.save();
        res.json({ message: 'Cliente actualizado con éxito', cliente });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await Cliente.findByIdAndDelete(id);
        res.json({ message: 'Cliente eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
