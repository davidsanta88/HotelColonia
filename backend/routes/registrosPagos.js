const express = require('express');
const router = express.Router({ mergeParams: true });
const Registro = require('../models/Registro');

// GET /registros/:id/pagos
router.get('/', async (req, res) => {
    try {
        const { id } = req.params;
        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
        res.json(registro.pagos || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /registros/:id/pagos
router.post('/', async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, medio_pago, medio, notas } = req.body;

        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        const nuevoPago = {
            monto: parseFloat(monto) || 0,
            medio: medio || medio_pago,
            notas: notas || '',
            usuario_nombre: req.userName || 'Sistema',
            fecha: new Date()
        };

        registro.pagos.push(nuevoPago);
        await registro.save();
        
        res.status(201).json({ message: 'Pago registrado correctamente', pagos: registro.pagos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /registros/:id/pagos/:pagoId
router.delete('/:pagoId', async (req, res) => {
    try {
        const { id, pagoId } = req.params;
        const registro = await Registro.findById(id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

        // Mongoose subdocument deletion
        const subdoc = registro.pagos.id(pagoId);
        if (subdoc) {
            registro.pagos.pull(pagoId);
            await registro.save();
        }
        
        res.json({ message: 'Pago eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
