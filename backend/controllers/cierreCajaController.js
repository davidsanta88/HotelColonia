const CierreCaja = require('../models/CierreCaja');

exports.createCierre = async (req, res) => {
    try {
        const { ingresos, egresos, saldo_calculado, saldo_real, efectivo_retirado, nota, medios_pago } = req.body;

        const diferencia = saldo_real ? saldo_real - saldo_calculado : 0;
        const retirado = efectivo_retirado ? parseFloat(efectivo_retirado) : 0;

        const newCierre = new CierreCaja({
            ingresos,
            egresos,
            saldo_calculado,
            saldo_real,
            efectivo_retirado: retirado,
            diferencia,
            nota,
            usuario: req.userId,
            usuario_nombre: req.userName || 'Sistema',
            medios_pago: medios_pago || { nequi: 0, bancolombia: 0, efectivo: 0, otros: 0 }
        });

        await newCierre.save();
        res.status(201).json(newCierre);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllCierres = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const cierres = await CierreCaja.find()
            .populate('usuario', 'nombre')
            .sort({ fecha: -1 })
            .limit(parseInt(limit));
        res.json(cierres);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCierre = async (req, res) => {
    try {
        const { nota, saldo_real, efectivo_retirado } = req.body;
        const cierre = await CierreCaja.findById(req.params.id);

        if (!cierre) return res.status(404).json({ message: 'Cierre no encontrado' });

        if (nota) cierre.nota = nota;
        if (saldo_real !== undefined) {
            cierre.saldo_real = saldo_real;
            cierre.diferencia = saldo_real - cierre.saldo_calculado;
        }
        if (efectivo_retirado !== undefined) {
            cierre.efectivo_retirado = parseFloat(efectivo_retirado) || 0;
        }

        await cierre.save();
        res.json(cierre);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteCierre = async (req, res) => {
    try {
        const cierre = await CierreCaja.findByIdAndDelete(req.params.id);
        if (!cierre) return res.status(404).json({ message: 'Cierre no encontrado' });
        res.json({ message: 'Cierre eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
