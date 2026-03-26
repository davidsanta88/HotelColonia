const express = require('express');
const router = express.Router({ mergeParams: true });
const Reserva = require('../models/Reserva');

// GET /reservas/:id/abonos
router.get('/', async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findById(id);
        if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
        res.json(reserva.abonos || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /reservas/:id/abonos
router.post('/', async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, medio_pago, notas } = req.body;

        const reserva = await Reserva.findById(id);
        if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

        const nuevoAbono = {
            monto,
            medio_pago,
            notas,
            usuario_nombre: req.userName,
            fecha: new Date()
        };

        reserva.abonos.push(nuevoAbono);
        // Recalcular el valor_abonado completo para evitar desincronización
        reserva.valor_abonado = reserva.abonos.reduce((total, a) => total + (parseFloat(a.monto) || 0), 0);
        
        await reserva.save();
        res.status(201).json({ message: 'Abono registrado correctamente', abonos: reserva.abonos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /reservas/:id/abonos/:abonoId
router.delete('/:abonoId', async (req, res) => {
    try {
        const { id, abonoId } = req.params;
        const reserva = await Reserva.findById(id);
        if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

        const abono = reserva.abonos.id(abonoId);
        if (abono) {
            // Eliminar el abono y recalcular el total completo
            reserva.abonos.pull(abonoId);
            reserva.valor_abonado = reserva.abonos.reduce((total, a) => total + (parseFloat(a.monto) || 0), 0);
            await reserva.save();
        }
        
        res.json({ message: 'Abono eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
