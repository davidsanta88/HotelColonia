const Anthropic = require('@anthropic-ai/sdk');
const Habitacion = require('../models/Habitacion');
const Registro = require('../models/Registro');
const Reserva = require('../models/Reserva');
const Gasto = require('../models/Gasto');
const SolicitudReserva = require('../models/SolicitudReserva');
const Mantenimiento = require('../models/Mantenimiento');
const HotelConfig = require('../models/HotelConfig');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tool definitions for Claude
const tools = [
    {
        name: 'get_habitaciones_disponibles',
        description: 'Obtiene la lista de habitaciones disponibles ahora mismo, con su número, tipo y precios.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_registros_activos',
        description: 'Obtiene los registros de hospedaje activos (huéspedes actualmente en el hotel), con habitación, cliente, fechas y total.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_reservas_proximas',
        description: 'Obtiene las reservas confirmadas/pendientes próximas (hoy y los siguientes días).',
        input_schema: {
            type: 'object',
            properties: {
                dias: {
                    type: 'number',
                    description: 'Número de días hacia adelante a consultar (default 7)'
                }
            },
            required: []
        }
    },
    {
        name: 'get_ingresos_hoy',
        description: 'Obtiene el total de ingresos del día de hoy (pagos recibidos en registros activos y finalizados hoy).',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_gastos_hoy',
        description: 'Obtiene los gastos registrados hoy, con categoría y monto.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_solicitudes_pendientes',
        description: 'Obtiene las solicitudes de reserva pendientes de aprobación.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_mantenimientos_activos',
        description: 'Obtiene las solicitudes de mantenimiento activas o pendientes.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_resumen_general',
        description: 'Obtiene un resumen general del estado actual del hotel: habitaciones ocupadas, disponibles, ingresos del día y solicitudes pendientes.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
];

// Tool execution handlers
async function executeTool(toolName, toolInput) {
    try {
        switch (toolName) {
            case 'get_habitaciones_disponibles': {
                const todas = await Habitacion.find()
                    .populate('tipo', 'nombre')
                    .populate('estado', 'nombre color');
                const registrosActivos = await Registro.find({ estado: 'activo' }).select('habitacion');
                const ocupadas = new Set(registrosActivos.map(r => r.habitacion.toString()));
                const disponibles = todas.filter(h => !ocupadas.has(h._id.toString()));
                return disponibles.map(h => ({
                    numero: h.numero,
                    tipo: h.tipo?.nombre || 'Sin tipo',
                    estado: h.estado?.nombre || 'Disponible',
                    estadoLimpieza: h.estadoLimpieza,
                    precio_base: h.precio_1
                }));
            }

            case 'get_registros_activos': {
                const registros = await Registro.find({ estado: 'activo' })
                    .populate('habitacion', 'numero')
                    .populate('cliente', 'nombre identificacion')
                    .sort({ fechaEntrada: -1 });
                return registros.map(r => ({
                    habitacion: r.habitacion?.numero,
                    cliente: r.cliente?.nombre || 'Desconocido',
                    fechaEntrada: r.fechaEntrada,
                    fechaSalidaEstimada: r.fechaSalida,
                    total: r.total,
                    pagado: r.pagos?.reduce((acc, p) => acc + (p.monto || 0), 0) || 0
                }));
            }

            case 'get_reservas_proximas': {
                const dias = toolInput.dias || 7;
                const desde = new Date();
                desde.setHours(0, 0, 0, 0);
                const hasta = new Date(desde);
                hasta.setDate(hasta.getDate() + dias);

                const reservas = await Reserva.find({
                    fecha_entrada: { $gte: desde, $lte: hasta },
                    estado: { $in: ['Confirmada', 'Pendiente'] }
                })
                    .populate('cliente', 'nombre')
                    .populate('habitacion', 'numero')
                    .sort({ fecha_entrada: 1 });

                return reservas.map(r => ({
                    cliente: r.cliente?.nombre || 'Desconocido',
                    habitacion: r.habitacion?.numero || r.habitaciones?.map(h => h.numero).join(', '),
                    fechaEntrada: r.fecha_entrada,
                    fechaSalida: r.fecha_salida,
                    estado: r.estado,
                    total: r.valor_total,
                    abonado: r.valor_abonado
                }));
            }

            case 'get_ingresos_hoy': {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const manana = new Date(hoy);
                manana.setDate(manana.getDate() + 1);

                const registros = await Registro.find({
                    $or: [
                        { estado: 'activo', fechaCreacion: { $gte: hoy, $lt: manana } },
                        { estado: 'finalizado', fechaSalidaReal: { $gte: hoy, $lt: manana } }
                    ]
                });

                let totalHoy = 0;
                let detallesPagos = [];
                registros.forEach(r => {
                    r.pagos?.forEach(p => {
                        const fechaPago = new Date(p.fecha);
                        if (fechaPago >= hoy && fechaPago < manana) {
                            totalHoy += p.monto || 0;
                            detallesPagos.push({ monto: p.monto, medio: p.medio, hora: p.fecha });
                        }
                    });
                });

                return { totalHoy, cantidadRegistros: registros.length, pagos: detallesPagos };
            }

            case 'get_gastos_hoy': {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const manana = new Date(hoy);
                manana.setDate(manana.getDate() + 1);

                const gastos = await Gasto.find({
                    fecha: { $gte: hoy, $lt: manana }
                }).populate('categoria', 'nombre');

                const total = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
                return {
                    total,
                    gastos: gastos.map(g => ({
                        descripcion: g.descripcion,
                        monto: g.monto,
                        categoria: g.categoria?.nombre || 'Sin categoría'
                    }))
                };
            }

            case 'get_solicitudes_pendientes': {
                const solicitudes = await SolicitudReserva.find({ estado: 'pendiente' })
                    .sort({ fechaCreacion: -1 });
                return solicitudes.map(s => ({
                    nombre: s.nombre,
                    telefono: s.telefono,
                    fechaEntrada: s.fechaEntrada,
                    fechaSalida: s.fechaSalida,
                    personas: s.personas,
                    mensaje: s.mensaje,
                    fechaSolicitud: s.fechaCreacion
                }));
            }

            case 'get_mantenimientos_activos': {
                const mantenimientos = await Mantenimiento.find({
                    estado: { $in: ['Pendiente', 'En progreso'] }
                }).populate('habitacion', 'numero');
                return mantenimientos.map(m => ({
                    habitacion: m.habitacion?.numero,
                    descripcion: m.descripcion,
                    prioridad: m.prioridad,
                    estado: m.estado,
                    fecha: m.fecha
                }));
            }

            case 'get_resumen_general': {
                const [todas, registrosActivos, reservasHoy, solicitudes] = await Promise.all([
                    Habitacion.find(),
                    Registro.find({ estado: 'activo' }),
                    Reserva.find({
                        fecha_entrada: {
                            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            $lt: new Date(new Date().setHours(23, 59, 59, 999))
                        },
                        estado: { $in: ['Confirmada', 'Pendiente'] }
                    }),
                    SolicitudReserva.find({ estado: 'pendiente' })
                ]);

                const totalHabs = todas.length;
                const ocupadas = registrosActivos.length;
                const disponibles = totalHabs - ocupadas;

                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const manana = new Date(hoy);
                manana.setDate(manana.getDate() + 1);

                const gastos = await Gasto.find({ fecha: { $gte: hoy, $lt: manana } });
                const totalGastosHoy = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);

                let totalIngresosHoy = 0;
                const regIngresos = await Registro.find({
                    $or: [
                        { estado: 'activo', fechaCreacion: { $gte: hoy, $lt: manana } },
                        { estado: 'finalizado', fechaSalidaReal: { $gte: hoy, $lt: manana } }
                    ]
                });
                regIngresos.forEach(r => {
                    r.pagos?.forEach(p => {
                        const f = new Date(p.fecha);
                        if (f >= hoy && f < manana) totalIngresosHoy += p.monto || 0;
                    });
                });

                return {
                    habitaciones: { total: totalHabs, ocupadas, disponibles },
                    ingresosHoy: totalIngresosHoy,
                    gastosHoy: totalGastosHoy,
                    reservasHoy: reservasHoy.length,
                    solicitudesPendientes: solicitudes.length,
                    ocupacion: totalHabs > 0 ? Math.round((ocupadas / totalHabs) * 100) : 0
                };
            }

            default:
                return { error: 'Herramienta no reconocida' };
        }
    } catch (err) {
        console.error(`[CHATBOT] Error ejecutando herramienta ${toolName}:`, err.message);
        return { error: err.message };
    }
}

const sendMessage = async (req, res) => {
    const { messages, hotelNombre } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: 'Se requiere un arreglo de mensajes.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ message: 'Clave de API de Anthropic no configurada. Agregue ANTHROPIC_API_KEY al archivo .env del backend.' });
    }

    const systemPrompt = `Eres un asistente inteligente para el sistema de gestión del ${hotelNombre || 'Hotel'}.
Tu función es ayudar al personal del hotel con consultas operativas en tiempo real.

Puedes consultar:
- Habitaciones disponibles y ocupadas
- Huéspedes actualmente hospedados
- Reservas próximas
- Ingresos y gastos del día
- Solicitudes de reserva pendientes
- Solicitudes de mantenimiento activas

Responde siempre en español, de forma clara y concisa.
Cuando el usuario pregunte sobre el estado del hotel, disponibilidad, ingresos u operaciones, usa las herramientas disponibles para obtener datos reales y actualizados.
Formatea los números de dinero con el símbolo $ y separadores de miles.
Si no hay datos, infórmalo claramente.
Sé amigable y profesional, como un asistente de recepción eficiente.`;

    try {
        let apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
        let response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages: apiMessages
        });

        // Agentic loop: ejecutar herramientas hasta obtener respuesta final
        while (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
            const toolResults = await Promise.all(
                toolUseBlocks.map(async (block) => {
                    const result = await executeTool(block.name, block.input);
                    return {
                        type: 'tool_result',
                        tool_use_id: block.id,
                        content: JSON.stringify(result)
                    };
                })
            );

            apiMessages = [
                ...apiMessages,
                { role: 'assistant', content: response.content },
                { role: 'user', content: toolResults }
            ];

            response = await client.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: systemPrompt,
                tools,
                messages: apiMessages
            });
        }

        const textBlock = response.content.find(b => b.type === 'text');
        const replyText = textBlock?.text || 'No pude generar una respuesta.';
        res.json({ reply: replyText });

    } catch (err) {
        console.error('[CHATBOT] Error:', err.message);
        if (err.status === 401) {
            return res.status(500).json({ message: 'API key de Anthropic inválida.' });
        }
        res.status(500).json({ message: 'Error al procesar el mensaje del chatbot.' });
    }
};

module.exports = { sendMessage };
