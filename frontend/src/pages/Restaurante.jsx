import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { 
    UtensilsCrossed, 
    Coffee, 
    Plus, 
    Search, 
    ShoppingCart, 
    Check, 
    X, 
    Users, 
    Hotel,
    Clock,
    DollarSign,
    ChefHat,
    LayoutGrid,
    Info,
    CreditCard,
    Printer,
    Trash2,
    History,
    Receipt,
    ArrowRight
} from 'lucide-react';
import Select from 'react-select';
import { formatCurrency } from '../utils/format';
import { format, subDays, startOfMonth } from 'date-fns';

const Restaurante = () => {
    const { user } = useContext(AuthContext);
    const [mesas, setMesas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [registrosActivos, setRegistrosActivos] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [activeTab, setActiveTab] = useState('mesas');
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [selectedMesa, setSelectedMesa] = useState(null);
    const [comandaActiva, setComandaActiva] = useState(null);
    
    // History States
    const [historial, setHistorial] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [dates, setDates] = useState({ 
        inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
        fin: format(new Date(), 'yyyy-MM-dd') 
    });

    // Form States
    const [cart, setCart] = useState([]);
    const [registroId, setRegistroId] = useState(null);
    const [huespedNombre, setHuespedNombre] = useState('Particular');
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'comandas') {
            fetchHistorial();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resMesas, resProd, resReg, resMP] = await Promise.all([
                api.get('/restaurante/mesas'),
                api.get('/productos'),
                api.get('/registros/activos'),
                api.get('/medios-pago')
            ]);
            setMesas(resMesas.data);
            
            // Filtrar productos relacionados con restaurante/comida/bebida
            const foodCategories = ['café', 'comida', 'bebida', 'restaurante', 'almuerzo', 'desayuno', 'cena'];
            setProductos(resProd.data.filter(p => p.activo && foodCategories.some(cat => p.categoria?.toLowerCase()?.includes(cat))));
            
            setRegistrosActivos(resReg.data);
            setMediosPago(resMP.data);
            
            if (resMesas.data.length === 0) {
                const confirmSeed = await Swal.fire({
                    title: 'Configuración Inicial',
                    text: 'No se encontraron mesas configuradas. ¿Desea crear 20 mesas de ejemplo?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, crear mesas',
                    cancelButtonText: 'Luego lo haré'
                });
                if (confirmSeed.isConfirmed) {
                    await api.post('/restaurante/mesas/seed');
                    const refreshMesas = await api.get('/restaurante/mesas');
                    setMesas(refreshMesas.data);
                }
            }
        } catch (error) {
            console.error('Error fetching restaurante data:', error);
            Swal.fire('Error', 'No se pudo cargar la información del restaurante', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorial = async () => {
        setLoadingHistorial(true);
        try {
            const res = await api.get(`/restaurante/comandas/historial?inicio=${dates.inicio}&fin=${dates.fin}`);
            setHistorial(res.data);
        } catch (error) {
            console.error('Error fetching historial:', error);
        } finally {
            setLoadingHistorial(false);
        }
    };

    const handleMesaClick = async (mesa) => {
        setSelectedMesa(mesa);
        setCart([]);
        setRegistroId(null);
        setHuespedNombre('Particular');
        
        if (mesa.estado === 'Ocupada') {
            try {
                const res = await api.get(`/restaurante/comandas/activa/${mesa._id}`);
                setComandaActiva(res.data);
                setHuespedNombre(res.data.huespedNombre || 'Particular');
                setRegistroId(res.data.registro || null);
            } catch (error) {
                console.error('Error fetching comanda:', error);
                setComandaActiva(null);
            }
        } else {
            setComandaActiva(null);
        }
        setShowComandaModal(true);
    };

    const addToCart = (prod) => {
        const existing = cart.find(item => item.id === (prod.id || prod._id));
        if (existing) {
            setCart(cart.map(item => item.id === (prod.id || prod._id) ? { ...item, cantidad: item.cantidad + 1 } : item));
        } else {
            setCart([...cart, { 
                id: prod.id || prod._id, 
                nombre: prod.nombre, 
                precio: prod.precio, 
                cantidad: 1 
            }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const abrirComanda = async () => {
        if (cart.length === 0) return Swal.fire('Aviso', 'Agregue productos a la comanda', 'warning');
        setSubmitting(true);
        try {
            const res = await api.post('/restaurante/comandas/abrir', {
                mesaId: selectedMesa._id,
                registroId: registroId,
                huespedNombre: huespedNombre,
                meseroId: user?.id || user?._id
            });
            
            await api.post('/restaurante/comandas/items', {
                comandaId: res.data._id,
                items: cart.map(i => ({
                    productoId: i.id,
                    nombre: i.nombre,
                    cantidad: i.cantidad,
                    precio: i.precio
                }))
            });

            Swal.fire({
                icon: 'success',
                title: 'Comanda Abierta',
                text: 'El pedido ha sido enviado a cocina.',
                timer: 2000,
                showConfirmButton: false
            });
            setShowComandaModal(false);
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo abrir la comanda', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const agregarPedido = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            await api.post('/restaurante/comandas/items', {
                comandaId: comandaActiva._id,
                items: cart.map(i => ({
                    productoId: i.id,
                    nombre: i.nombre,
                    cantidad: i.cantidad,
                    precio: i.precio
                }))
            });
            Swal.fire({
                icon: 'success',
                title: 'Pedido Agregado',
                text: 'Se han adicionado los productos a la cuenta.',
                timer: 1500,
                showConfirmButton: false
            });
            setShowComandaModal(false);
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo agregar el pedido', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const cerrarComanda = async (cargoAHabitacion = false) => {
        const confirm = await Swal.fire({
            title: '¿Cerrar Mesa?',
            text: cargoAHabitacion ? `Se cargarán $${formatCurrency(comandaActiva.total)} a la cuenta de la habitación.` : `¿Desea cerrar la mesa ${selectedMesa.numero} por un total de $${formatCurrency(comandaActiva.total)}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar y cobrar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#0f172a'
        });

        if (confirm.isConfirmed) {
            setSubmitting(true);
            try {
                await api.post('/restaurante/comandas/cerrar', {
                    comandaId: comandaActiva._id,
                    cargoAHabitacion: cargoAHabitacion
                });
                Swal.fire('Éxito', 'La cuenta ha sido cerrada correctamente.', 'success');
                setShowComandaModal(false);
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo cerrar la comanda', 'error');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const registroOptions = [
        { value: null, label: 'Particular / Venta Directa' },
        ...registrosActivos.map(reg => ({
            value: reg.id,
            label: `Hab. ${reg.numero_habitacion} - ${reg.nombre_cliente}`
        }))
    ];

    const totalCart = cart.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
            <div className="relative">
                <UtensilsCrossed size={64} className="text-primary-500 animate-bounce" />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                    <Coffee size={24} className="text-primary-400 animate-pulse" />
                </div>
            </div>
            <div className="text-center">
                <p className="font-black text-slate-800 uppercase tracking-[0.3em] text-sm">Cargando Restaurante</p>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Sincronizando Mesas...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Elite Header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
                    <UtensilsCrossed size={400} className="transform translate-x-20 -translate-y-20 rotate-12" />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-full font-black text-[10px] uppercase tracking-widest border border-primary-500/30">
                            <ChefHat size={14} /> Módulo de Alimentos & Bebidas
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                            Servicio de <span className="text-primary-500">Cafetería.</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                            Gestione mesas, comandas y pedidos especiales con integración directa al folio del huésped.
                        </p>
                        
                        <div className="flex p-1 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 w-fit">
                            <button 
                                onClick={() => setActiveTab('mesas')}
                                className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'mesas' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}
                            >
                                Mesas
                            </button>
                            <button 
                                onClick={() => setActiveTab('comandas')}
                                className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'comandas' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}
                            >
                                Historial
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                            <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ocupación Actual</p>
                                <p className="text-4xl font-black">{mesas.filter(m => m.estado === 'Ocupada').length} <span className="text-lg text-white/30">/ {mesas.length}</span></p>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ventas Hoy</p>
                                <p className="text-3xl font-black">${formatCurrency(historial.filter(h => format(new Date(h.fechaCierre), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).reduce((acc, h) => acc + h.total, 0))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'mesas' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {mesas.map((mesa) => (
                        <button
                            key={mesa._id}
                            onClick={() => handleMesaClick(mesa)}
                            className={`group relative h-56 rounded-[3rem] border-2 transition-all duration-700 flex flex-col items-center justify-center gap-4 overflow-hidden
                                ${mesa.estado === 'Ocupada' 
                                    ? 'bg-red-50 border-red-200 text-red-900 shadow-2xl shadow-red-100 scale-105 z-10' 
                                    : 'bg-white border-slate-100 text-slate-900 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-100 hover:-translate-y-2'
                                }`}
                        >
                            <div className={`p-5 rounded-[2rem] transition-all duration-500 ${mesa.estado === 'Ocupada' ? 'bg-red-500 text-white rotate-12 scale-110' : 'bg-slate-50 text-slate-300 group-hover:bg-primary-500 group-hover:text-white group-hover:-rotate-12'}`}>
                                <UtensilsCrossed size={32} />
                            </div>
                            
                            <div className="text-center space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Mesa</span>
                                <h3 className="text-4xl font-black tracking-tighter leading-none">{mesa.numero}</h3>
                            </div>

                            {mesa.estado === 'Ocupada' && (
                                <div className="absolute bottom-6 flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div> En Servicio
                                </div>
                            )}
                            
                            <div className={`absolute top-6 right-6 w-3 h-3 rounded-full ${mesa.estado === 'Ocupada' ? 'bg-red-500' : 'bg-emerald-400'}`}></div>
                        </button>
                    ))}
                    
                    <button className="h-56 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-200 hover:border-primary-200 hover:text-primary-300 transition-all group">
                        <div className="p-4 bg-slate-50 rounded-full group-hover:bg-primary-50 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Configurar Mesas</span>
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                    <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-lg shadow-slate-200">
                                <History size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Historial de Comandas</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Cierres de cuenta y auditoría</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-inner">
                            <input 
                                type="date" 
                                value={dates.inicio} 
                                onChange={(e) => setDates({...dates, inicio: e.target.value})}
                                className="bg-transparent border-none focus:ring-0 font-bold text-xs text-slate-600"
                            />
                            <span className="text-slate-300 font-black">/</span>
                            <input 
                                type="date" 
                                value={dates.fin} 
                                onChange={(e) => setDates({...dates, fin: e.target.value})}
                                className="bg-transparent border-none focus:ring-0 font-bold text-xs text-slate-600"
                            />
                            <button 
                                onClick={fetchHistorial}
                                className="bg-slate-900 text-white p-3 rounded-full hover:bg-slate-800 transition-all shadow-md active:scale-90"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b border-slate-100">
                                    <th className="px-10 py-6">Mesa / Cliente</th>
                                    <th className="px-10 py-6">Vínculo</th>
                                    <th className="px-10 py-6">Atendido Por</th>
                                    <th className="px-10 py-6">Fecha / Hora</th>
                                    <th className="px-10 py-6 text-right">Monto Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {historial.map((h, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-900 text-sm">
                                                    {h.mesa?.numero || h.mesaNumero}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{h.huespedNombre}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID #{h._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${h.registro ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {h.registro ? 'A Habitación' : 'Venta Directa'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-bold text-slate-700">{h.mesero?.nombre || 'Administrador'}</p>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-xs font-bold text-slate-500">{format(new Date(h.fechaCierre), 'dd MMM, HH:mm')}</p>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className="text-lg font-black text-slate-900">${formatCurrency(h.total)}</span>
                                        </td>
                                    </tr>
                                ))}
                                {historial.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Receipt size={48} className="opacity-20" />
                                                <p className="font-black uppercase tracking-widest text-xs">No hay registros en este periodo</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Comanda (Premium) */}
            {showComandaModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500 relative">
                        
                        {/* Header Elite */}
                        <div className={`p-10 flex justify-between items-center text-white ${comandaActiva ? 'bg-red-600 shadow-lg shadow-red-200' : 'bg-slate-900 shadow-lg shadow-slate-400'}`}>
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md shadow-inner">
                                    <UtensilsCrossed size={36} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-4xl font-black tracking-tighter">Mesa {selectedMesa.numero}</h2>
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedMesa.ubicacion}</span>
                                    </div>
                                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-1">{comandaActiva ? `Cuenta Abierta • ${comandaActiva.huespedNombre}` : 'Nueva Orden de Servicio'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowComandaModal(false)} className="p-5 bg-white/10 hover:bg-white/20 rounded-3xl transition-all border border-white/10 active:scale-90">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Side: Menú */}
                            <div className="flex-1 p-12 overflow-y-auto space-y-10 border-r border-slate-100 bg-slate-50/30">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="relative flex-1 w-full">
                                        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar en el menú..." 
                                            className="w-full pl-16 pr-8 py-5 bg-white rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-primary-500/20 font-black text-slate-700 placeholder:text-slate-300 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        <button className="px-6 py-3 bg-white shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900">Todos</button>
                                        <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Comida</button>
                                        <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Bebidas</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {productosFiltrados.map(prod => (
                                        <button 
                                            key={prod._id}
                                            onClick={() => addToCart(prod)}
                                            className="p-6 bg-white border border-slate-100 rounded-[2.5rem] text-left hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-100 hover:-translate-y-1 transition-all flex flex-col justify-between group h-44 shadow-sm"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-black text-primary-500 bg-primary-50 px-2 py-1 rounded-lg uppercase tracking-widest">{prod.categoria}</span>
                                                    <div className="bg-slate-50 p-2 rounded-xl text-slate-200 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                                <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-primary-700 transition-colors">{prod.nombre}</h4>
                                            </div>
                                            <div className="mt-4">
                                                <span className="text-2xl font-black text-slate-900 tracking-tighter">${formatCurrency(prod.precio)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Factura / Checkout */}
                            <div className="w-[450px] bg-white flex flex-col shadow-2xl z-10 border-l border-slate-100">
                                <div className="p-10 border-b border-slate-100 space-y-8 bg-slate-50/50">
                                    <div className="flex items-center gap-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                        <Info size={16} /> Asignación de Servicio
                                    </div>
                                    
                                    {!comandaActiva ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase ml-2">¿Vincular a Huésped?</label>
                                                <Select 
                                                    options={registroOptions}
                                                    defaultValue={registroOptions[0]}
                                                    onChange={(opt) => setRegistroId(opt.value)}
                                                    className="font-bold text-sm"
                                                    styles={{
                                                        control: (base) => ({ ...base, borderRadius: '1.5rem', padding: '10px', border: '2px solid #f1f5f9', boxShadow: 'none' })
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase ml-2">Nombre Responsable:</label>
                                                <input 
                                                    type="text" 
                                                    value={huespedNombre}
                                                    onChange={(e) => setHuespedNombre(e.target.value)}
                                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-black text-sm text-slate-900 transition-all"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-xs font-bold uppercase">Titular</span>
                                                <span className="text-slate-900 font-black text-base">{comandaActiva.huespedNombre}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-xs font-bold uppercase">Mesa</span>
                                                <span className="text-slate-900 font-black text-base">#{selectedMesa.numero}</span>
                                            </div>
                                            <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cuenta Acumulada</span>
                                                <span className="text-2xl font-black text-primary-600 tracking-tighter">${formatCurrency(comandaActiva.total)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                            <ShoppingCart size={16} /> Detalle del Pedido
                                        </div>
                                        {cart.length > 0 && <span className="text-[10px] font-black bg-primary-100 text-primary-600 px-2 py-1 rounded-lg">{cart.length} ITEMS</span>}
                                    </div>
                                    
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] group transition-all hover:bg-slate-100/80">
                                            <div className="space-y-1">
                                                <h5 className="font-black text-slate-900 text-sm leading-none">{item.nombre}</h5>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.cantidad} x ${formatCurrency(item.precio)}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-black text-slate-900 text-base">${formatCurrency(item.precio * item.cantidad)}</span>
                                                <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-red-500 transition-all hover:scale-110">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {cart.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-200">
                                            <div className="p-8 bg-slate-50 rounded-full mb-4">
                                                <ShoppingCart size={48} className="opacity-10" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargue productos al pedido</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-10 bg-slate-50 rounded-b-[4rem] space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Subtotal de Orden</span>
                                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mt-1">${formatCurrency(totalCart)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</p>
                                            <p className="text-xl font-black text-slate-900">{cart.reduce((acc, i) => acc + i.cantidad, 0)}</p>
                                        </div>
                                    </div>

                                    {!comandaActiva ? (
                                        <button 
                                            onClick={abrirComanda}
                                            disabled={submitting || cart.length === 0}
                                            className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {submitting ? 'Procesando...' : <><ArrowRight size={20} /> Abrir y Enviar a Cocina</>}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <button 
                                                onClick={agregarPedido}
                                                disabled={submitting || cart.length === 0}
                                                className="w-full py-6 bg-primary-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {submitting ? 'Adicionando...' : <><Plus size={20} /> Adicionar a la Cuenta</>}
                                            </button>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => cerrarComanda(false)}
                                                    className="flex items-center justify-center gap-3 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-[10px] uppercase text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                                                >
                                                    <CreditCard size={16} /> Pago Caja
                                                </button>
                                                <button 
                                                    onClick={() => cerrarComanda(true)}
                                                    disabled={!comandaActiva.registro}
                                                    className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                                                >
                                                    <Hotel size={16} /> A Habitación
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Restaurante;
