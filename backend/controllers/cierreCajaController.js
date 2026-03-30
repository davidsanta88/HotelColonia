const CierreCaja = require('../models/CierreCaja');

exports.createCierre = async (req, res) => {
    try {
        const { ingresos, egresos, saldo_calculado, saldo_real, nota, medios_pago } = req.body;
        
        const diferencia = saldo_real ? saldo_real - saldo_calculado : 0;

        const newCierre = new CierreCaja({
            ingresos,
            egresos,
            saldo_calculado,
            saldo_real,
            diferencia,
            nota,
            usuario: req.userId,
            usuario_nombre: req.usuarioNombre || 'Sistema',
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
