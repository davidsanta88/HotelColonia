const PersonalFinance = require('../models/PersonalFinance');
const PersonalCategory = require('../models/PersonalCategory');
const PersonalGoal = require('../models/PersonalGoal');
const PersonalRecurring = require('../models/PersonalRecurring');

// --- Categorías ---
exports.getPersonalCategories = async (req, res) => {
    try {
        const categories = await PersonalCategory.find({ usuario_id: req.userId });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
    }
};

exports.createPersonalCategory = async (req, res) => {
    try {
        const { nombre, tipo, color } = req.body;
        const newCat = new PersonalCategory({
            nombre, tipo, color, usuario_id: req.userId
        });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear categoría', error: error.message });
    }
};

exports.deletePersonalCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const inUse = await PersonalFinance.findOne({ categoria_id: id });
        if (inUse) {
            return res.status(400).json({ mensaje: 'No se puede eliminar una categoría que está en uso' });
        }
        await PersonalCategory.deleteOne({ _id: id, usuario_id: req.userId });
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar categoría', error: error.message });
    }
};

// --- Finanzas ---
exports.getPersonalFinances = async (req, res) => {
    try {
        const finances = await PersonalFinance.find({ usuario_id: req.userId })
            .populate('categoria_id')
            .sort({ fecha: -1 });
        
        const resumen = { ingresos: 0, gastos: 0, balance: 0 };
        const porCategoria = {};
        
        // --- Cálculo de presupuesto (Mes Actual) ---
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const categories = await PersonalCategory.find({ usuario_id: req.userId });
        const budgetAnalysis = categories.map(cat => ({
            id: cat._id,
            nombre: cat.nombre,
            tipo: cat.tipo,
            presupuesto: cat.presupuestoMensual || 0,
            actual: 0
        }));

        finances.forEach(item => {
            const catNombre = item.categoria_id?.nombre || 'Sin Categoría';
            const catId = item.categoria_id?._id?.toString();
            
            if (item.tipo === 'ingreso') {
                resumen.ingresos += item.monto;
            } else {
                resumen.gastos += item.monto;
                porCategoria[catNombre] = (porCategoria[catNombre] || 0) + item.monto;
            }

            // Si es de este mes, sumar al budgetAnalysis
            if (item.fecha >= startOfMonth && item.fecha <= endOfMonth) {
                const bIndex = budgetAnalysis.findIndex(b => b.id.toString() === catId);
                if (bIndex !== -1) {
                    budgetAnalysis[bIndex].actual += item.monto;
                }
            }
        });

        resumen.balance = resumen.ingresos - resumen.gastos;
        const metricasGastos = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

        res.json({ data: finances, resumen, metricasGastos, budgetAnalysis });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener finanzas', error: error.message });
    }
};

exports.createPersonalFinance = async (req, res) => {
    try {
        const { tipo, categoria_id, monto, descripcion, fecha } = req.body;
        const newRecord = new PersonalFinance({
            tipo, categoria_id, monto, descripcion, 
            fecha: fecha || new Date(),
            usuario_id: req.userId
        });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear registro', error: error.message });
    }
};

exports.deletePersonalFinance = async (req, res) => {
    try {
        const { id } = req.params;
        await PersonalFinance.deleteOne({ _id: id, usuario_id: req.userId });
        res.json({ mensaje: 'Registro eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
    }
};

exports.updatePersonalFinance = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, categoria_id, monto, descripcion, fecha } = req.body;
        
        const updated = await PersonalFinance.findOneAndUpdate(
            { _id: id, usuario_id: req.userId },
            { tipo, categoria_id, monto, descripcion, fecha },
            { new: true }
        );
        
        if (!updated) return res.status(404).json({ mensaje: 'Registro no encontrado' });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar', error: error.message });
    }
};

// --- Metas de Ahorro ---
exports.getPersonalGoals = async (req, res) => {
    try {
        const goals = await PersonalGoal.find({ usuario_id: req.userId }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener metas', error: error.message });
    }
};

exports.createPersonalGoal = async (req, res) => {
    try {
        const { nombre, montoObjetivo, fechaLimite, color } = req.body;
        const newGoal = new PersonalGoal({
            nombre, montoObjetivo, fechaLimite, color, usuario_id: req.userId
        });
        await newGoal.save();
        res.status(201).json(newGoal);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear meta', error: error.message });
    }
};

exports.updatePersonalGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await PersonalGoal.findOneAndUpdate(
            { _id: id, usuario_id: req.userId },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar meta', error: error.message });
    }
};

exports.deletePersonalGoal = async (req, res) => {
    try {
        const { id } = req.params;
        await PersonalGoal.deleteOne({ _id: id, usuario_id: req.userId });
        res.json({ mensaje: 'Meta eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar meta', error: error.message });
    }
};

exports.contributeToGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto } = req.body;
        
        const goal = await PersonalGoal.findOne({ _id: id, usuario_id: req.userId });
        if (!goal) return res.status(404).json({ mensaje: 'Meta no encontrada' });
        
        goal.montoActual += parseFloat(monto);
        await goal.save();
        
        res.json(goal);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al registrar abono', error: error.message });
    }
};

// --- Recurrentes ---
exports.getPersonalRecurrentes = async (req, res) => {
    try {
        const recurrentes = await PersonalRecurring.find({ usuario_id: req.userId }).populate('categoria_id');
        res.json(recurrentes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener recurrentes', error: error.message });
    }
};

exports.createPersonalRecurrente = async (req, res) => {
    try {
        const newRec = new PersonalRecurring({ ...req.body, usuario_id: req.userId });
        await newRec.save();
        res.status(201).json(newRec);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear recurrente', error: error.message });
    }
};

exports.updatePersonalRecurrente = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await PersonalRecurring.findOneAndUpdate(
            { _id: id, usuario_id: req.userId },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar recurrente', error: error.message });
    }
};

exports.deletePersonalRecurrente = async (req, res) => {
    try {
        const { id } = req.params;
        await PersonalRecurring.deleteOne({ _id: id, usuario_id: req.userId });
        res.json({ mensaje: 'Recurrente eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar recurrente', error: error.message });
    }
};

exports.processRecurrentes = async (req, res) => {
    try {
        const { mes, anio } = req.body; // e.g. 5, 2026
        const recurrentes = await PersonalRecurring.find({ usuario_id: req.userId, activo: true });
        
        const added = [];
        for (const rec of recurrentes) {
            // Verificar si ya existe este mes
            const startOfMonth = new Date(anio, mes - 1, 1);
            const endOfMonth = new Date(anio, mes, 0);
            
            const existing = await PersonalFinance.findOne({
                usuario_id: req.userId,
                descripcion: { $regex: new RegExp(`\\[${rec.nombre}\\]`, 'i') },
                fecha: { $gte: startOfMonth, $lte: endOfMonth }
            });

            if (!existing) {
                const day = Math.min(rec.diaCobro, endOfMonth.getDate());
                const newRecord = new PersonalFinance({
                    usuario_id: req.userId,
                    tipo: rec.tipo,
                    categoria_id: rec.categoria_id,
                    monto: rec.monto,
                    descripcion: `[${rec.nombre}] ${rec.descripcion || ''}`,
                    fecha: new Date(anio, mes - 1, day)
                });
                await newRecord.save();
                added.push(newRecord);
            }
        }
        
        res.json({ mensaje: `Se procesaron los recurrentes. Se añadieron ${added.length} registros nuevos.`, added });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar recurrentes', error: error.message });
    }
};
