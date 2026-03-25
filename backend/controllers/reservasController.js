const Reserva = require('../models/Reserva');
const Habitacion = require('../models/Habitacion');

exports.getReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find()
            .populate('cliente')
            .populate('habitacion') // legacy
            .populate('habitaciones.habitacion') // new
            .sort({ fecha_entrada: 1, fechaInicio: 1 });
        
        // Ensure every reservation has expected fields even if not migrated
        const formatted = reservas.map(r => {
            const obj = r.toObject({ virtuals: true });
            
            // Fallback for rooms
            if ((!obj.habitaciones || obj.habitaciones.length === 0) && obj.habitacion) {
                obj.habitaciones = [{
                    habitacion: obj.habitacion,
                    numero: obj.habitacion.numero,
                    precio_acordado: obj.habitacion.precio_1 || 0
                }];
            }
            
            // Fallback for dates
            if (!obj.fecha_entrada && obj.fechaInicio) obj.fecha_entrada = obj.fechaInicio;
            if (!obj.fecha_salida && obj.fechaFin) obj.fecha_salida = obj.fechaFin;

            // Ensure client_nombre is present even if virtual fails for some reason
            if (!obj.cliente_nombre) {
                obj.cliente_nombre = obj.cliente?.nombre || 'Desconocido';
            }

            return obj;
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllReservas = exports.getReservas;

exports.createReserva = async (req, res) => {
    try {
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, ...rest } = req.body;
        
        const payload = {
            ...rest,
            cliente: cliente_id,
            fecha_entrada,
            fecha_salida,
            // Fallback for old apps sending singular date names
            fechaInicio: fecha_entrada || rest.fechaInicio,
            fechaFin: fecha_salida || rest.fechaFin,
            usuarioCreacion: req.userName,
            habitaciones: []
        };

        if (habitaciones && Array.isArray(habitaciones)) {
            for (const h of habitaciones) {
                const habDoc = await Habitacion.findById(h.id || h.habitacion_id);
                payload.habitaciones.push({
                    habitacion: h.id || h.habitacion_id,
                    numero: habDoc ? habDoc.numero : '',
                    precio_acordado: h.precio || h.precio_acordado || 0
                });
            }
            // For backward compatibility, set the first room in the singular field
            if (payload.habitaciones.length > 0) {
                payload.habitacion = payload.habitaciones[0].habitacion;
            }
        }

        const newReserva = new Reserva(payload);
        await newReserva.save();
        res.status(201).json(newReserva);
    } catch (err) {
        console.error('Error creating reserva:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, habitaciones, fecha_entrada, fecha_salida, ...rest } = req.body;

        const updateData = {
            ...rest,
            cliente: cliente_id || rest.cliente,
            fecha_entrada,
            fecha_salida
        };

        if (fecha_entrada) updateData.fechaInicio = fecha_entrada;
        if (fecha_salida) updateData.fechaFin = fecha_salida;

        if (habitaciones && Array.isArray(habitaciones)) {
            updateData.habitaciones = [];
            for (const h of habitaciones) {
                const habDoc = await Habitacion.findById(h.id || h.habitacion_id || h.value);
                updateData.habitaciones.push({
                    habitacion: h.id || h.habitacion_id || h.value,
                    numero: habDoc ? habDoc.numero : '',
                    precio_acordado: h.precio || h.precio_acordado || 0
                });
            }
            if (updateData.habitaciones.length > 0) {
                updateData.habitacion = updateData.habitaciones[0].habitacion;
            }
        }

        const updated = await Reserva.findByIdAndUpdate(id, updateData, { new: true })
            .populate('cliente')
            .populate('habitaciones.habitacion');
            
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateReservaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const updated = await Reserva.findByIdAndUpdate(id, { estado }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteReserva = async (req, res) => {
    try {
        const { id } = req.params;
        await Reserva.findByIdAndDelete(id);
        res.json({ message: 'Reserva eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
