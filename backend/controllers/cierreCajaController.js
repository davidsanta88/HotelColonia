const CierreCaja = require('../models/CierreCaja');

exports.createCierre = async (req, res) => {
    try {
        const { ingresos, egresos, saldo_calculado, saldo_real, efectivo_retirado, nota, medios_pago, verificacion_bancos } = req.body;

        const diferencia = saldo_real ? saldo_real - saldo_calculado : 0;
        const retirado = efectivo_retirado ? parseFloat(efectivo_retirado) : 0;

        const mp = medios_pago || { nequi: 0, bancolombia: 0, efectivo: 0, otros: 0 };

        let vb = { nequi_real: null, bancolombia_real: null, diferencia_nequi: 0, diferencia_bancolombia: 0, verificado: false };
        if (verificacion_bancos) {
            const nqReal = verificacion_bancos.nequi_real != null ? parseFloat(verificacion_bancos.nequi_real) : null;
            const bcReal = verificacion_bancos.bancolombia_real != null ? parseFloat(verificacion_bancos.bancolombia_real) : null;
            vb = {
                nequi_real: nqReal,
                bancolombia_real: bcReal,
                diferencia_nequi: nqReal != null ? nqReal - (mp.nequi || 0) : 0,
                diferencia_bancolombia: bcReal != null ? bcReal - (mp.bancolombia || 0) : 0,
                verificado: nqReal != null || bcReal != null
            };
        }

        const newCierre = new CierreCaja({
            ingresos, egresos, saldo_calculado,
            saldo_real, efectivo_retirado: retirado,
            diferencia, nota,
            usuario: req.userId,
            usuario_nombre: req.userName || 'Sistema',
            medios_pago: mp,
            verificacion_bancos: vb
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
        if (req.body.verificacion_bancos) {
            const vb = req.body.verificacion_bancos;
            const nqReal = vb.nequi_real != null ? parseFloat(vb.nequi_real) : null;
            const bcReal = vb.bancolombia_real != null ? parseFloat(vb.bancolombia_real) : null;
            const nequiSistema = cierre.medios_pago?.nequi || 0;
            const bancSistema = cierre.medios_pago?.bancolombia || 0;
            cierre.verificacion_bancos = {
                nequi_real: nqReal,
                bancolombia_real: bcReal,
                diferencia_nequi: nqReal != null ? nqReal - nequiSistema : 0,
                diferencia_bancolombia: bcReal != null ? bcReal - bancSistema : 0,
                verificado: nqReal != null || bcReal != null
            };
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
