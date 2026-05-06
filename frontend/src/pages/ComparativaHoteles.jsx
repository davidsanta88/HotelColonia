import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Hotel,
    DollarSign,
    Calendar,
    RefreshCw,
    Loader2,
    LayoutDashboard,
    Activity,
    Lock,
    Bell,
    Award,
    Trophy,
    Sparkles,
    AlertTriangle,
    AlertCircle,
    Eye,
    MapPin,
    Zap,
    Users,
    Brush,
    Target,
    Heart,
    Crown,
    ShieldCheck,
    User,
    Building2,
    Clock,
    CheckCircle,
    Info,
    FileText,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';
import { format, subDays, startOfMonth, differenceInDays, parseISO, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const PERIODOS = [
    { label: 'Hoy', getDates: () => ({ inicio: format(new Date(), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 d├¡as', getDates: () => ({ inicio: format(subDays(new Date(), 6), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 d├¡as', getDates: () => ({ inicio: format(subDays(new Date(), 29), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Este mes', getDates: () => ({ inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'), fin: format(addDays(new Date(), 1), 'yyyy-MM-dd') }) },
    { label: '90 d├¡as', getDates: () => ({ inicio: format(subDays(new Date(), 89), 'yyyy-MM-dd'), fin: format(new Date(), 'yyyy-MM-dd') }) },
];

const ComparativaHoteles = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodoActivo, setPeriodoActivo] = useState(3);
    const [dates, setDates] = useState(PERIODOS[3].getDates());
    const [statsConsolidadas, setStatsConsolidadas] = useState(null);
    const [showCajaModal, setShowCajaModal] = useState(false);
    const [cajaModalData, setCajaModalData] = useState([]);
    const [cajaModalLoading, setCajaModalLoading] = useState(false);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [cajaFilters, setCajaFilters] = useState({ hotel: '', fecha: '', tipo: '', descripcion: '', usuario: '', medio: '', valor: '' });

    useEffect(() => {
        fetchComparativeData();
        fetchConsolidatedStats();
    }, [dates]);

    const fetchConsolidatedStats = async () => {
        try {
            const response = await api.get(`/reportes/stats-consolidado?inicio=${dates.inicio}&fin=${dates.fin}`);
            setStatsConsolidadas(response.data);
        } catch (error) {
            console.error('Error fetching consolidated stats:', error);
        }
    };

    const fetchComparativeData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/stats/comparative?inicio=${dates.inicio}&fin=${dates.fin}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching comparative stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarPeriodo = (idx) => {
        setPeriodoActivo(idx);
        setDates(PERIODOS[idx].getDates());
    };

    const fetchCajaModal = async () => {
        setCajaModalLoading(true);
        setShowCajaModal(true);
        try {
            const fin = format(new Date(), 'yyyy-MM-dd');
            const inicio = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            const res = await api.get(`/reportes/detalle-ingresos-consolidado?inicio=${inicio}&fin=${fin}`);
            setCajaModalData(res.data || []);
        } catch (e) {
            console.error('Error fetching caja modal', e);
        } finally {
            setCajaModalLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
    );

    const allLabels = Array.from(new Set([
        ...(data?.plaza?.history?.map(p => p.label) || []),
        ...(data?.colonial?.history?.map(c => c.label) || [])
    ])).sort((a, b) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        if (months.includes(a) && months.includes(b)) {
            return months.indexOf(a) - months.indexOf(b);
        }
        try {
            const [da, ma] = a.split('/').map(Number);
            const [db, mb] = b.split('/').map(Number);
            if (ma !== mb) return ma - mb;
            return da - db;
        } catch (e) {
            return a.localeCompare(b);
        }
    });

    const chartData = allLabels.map(label => {
        const p = data?.plaza?.history?.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
        const c = data?.colonial?.history?.find(x => x.label === label) || { ingresos: 0, egresos: 0, margen: 0 };
        return {
            name: label,
            plazaIngresos: p.ingresos,
            plazaEgresos: p.egresos,
            plazaMargen: p.margen,
            colonialIngresos: c.ingresos,
            colonialEgresos: c.egresos,
            colonialMargen: c.margen
        };
    });

    const totalPlaza = data?.plaza?.history?.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const totalColonial = data?.colonial?.history?.reduce((acc, curr) => acc + curr.ingresos, 0) || 0;
    const shopPlaza = data?.plaza?.history?.reduce((acc, curr) => acc + (curr.tienda || 0), 0) || 0;
    const shopColonial = data?.colonial?.history?.reduce((acc, curr) => acc + (curr.tienda || 0), 0) || 0;
    const plazaExpenses = data?.plaza?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;
    const colonialExpenses = data?.colonial?.history?.reduce((acc, curr) => acc + curr.egresos, 0) || 0;

    const totalGlobalIngresos = totalPlaza + totalColonial;
    const totalGlobalEgresos = plazaExpenses + colonialExpenses;
    const totalGlobalTienda = shopPlaza + shopColonial;
    const globalDisponibles = (data?.plaza?.rooms?.disponibles || 0) + (data?.colonial?.rooms?.disponibles || 0);
    const globalOcupadas = (data?.plaza?.rooms?.ocupadas || 0) + (data?.colonial?.rooms?.ocupadas || 0);
    const globalAseo = (data?.plaza?.rooms?.aseo || 0) + (data?.colonial?.rooms?.aseo || 0);

    const totalGlobalMargen = totalGlobalIngresos - totalGlobalEgresos;
    const globalMargenPercent = totalGlobalIngresos > 0 ? (totalGlobalMargen / totalGlobalIngresos) * 100 : 0;
    
    const diffDays = Math.max(1, differenceInDays(parseISO(dates.fin), parseISO(dates.inicio)) + 1);
    const globalDailyAvg = totalGlobalIngresos / diffDays;
    const globalExpensesAvg = totalGlobalEgresos / diffDays;
    const globalProfitAvg = globalDailyAvg - globalExpensesAvg;
    const plazaDailyAvg = totalPlaza / diffDays;
    const plazaExpensesAvg = plazaExpenses / diffDays;
    const plazaProfitAvg = plazaDailyAvg - plazaExpensesAvg;
    const colonialDailyAvg = totalColonial / diffDays;
    const colonialExpensesAvg = colonialExpenses / diffDays;
    const colonialProfitAvg = colonialDailyAvg - colonialExpensesAvg;
    
    const globalTotalHabitaciones = globalDisponibles + globalOcupadas + globalAseo;
    const globalOccupancyPercent = globalTotalHabitaciones > 0 ? (globalOcupadas / globalTotalHabitaciones) * 100 : 0;
    const globalFreePercent = globalTotalHabitaciones > 0 ? (globalDisponibles / globalTotalHabitaciones) * 100 : 0;
    const globalAseoPercent = globalTotalHabitaciones > 0 ? (globalAseo / globalTotalHabitaciones) * 100 : 0;
    
    const incomeMixData = [
        { name: 'Hotel Plaza', value: totalPlaza, color: '#2563eb' },
        { name: 'Hotel Colonial', value: totalColonial, color: '#6366f1' }
    ];

    const globalCashTotal = (data?.plaza?.cash?.efectivo || 0) + (data?.colonial?.cash?.efectivo || 0);
    const globalCashBase = (data?.plaza?.cash?.base || 0) + (data?.colonial?.cash?.base || 0);
    const globalCashTotalConBase = globalCashTotal + globalCashBase;

    // Saldo pendiente por cobrar
    const plazaSaldoPendiente = data?.plaza?.saldoPendiente?.total || 0;
    const plazaSaldoCount = data?.plaza?.saldoPendiente?.count || 0;
    const colonialSaldoPendiente = data?.colonial?.saldoPendiente?.total || 0;
    const colonialSaldoCount = data?.colonial?.saldoPendiente?.count || 0;
    const totalSaldoPendiente = plazaSaldoPendiente + colonialSaldoPendiente;

    // Metas mensuales
    const plazaMetaVentas = data?.plaza?.config?.metaVentasMensual || 0;
    const plazaMetaGanancia = data?.plaza?.config?.metaGananciaMensual || 0;
    const colonialMetaVentas = data?.colonial?.config?.metaVentasMensual || 0;
    const colonialMetaGanancia = data?.colonial?.config?.metaGananciaMensual || 0;
    const totalMetaVentas = plazaMetaVentas + colonialMetaVentas;
    const totalMetaGanancia = plazaMetaGanancia + colonialMetaGanancia;
    const plazaVentasProgreso = plazaMetaVentas > 0 ? (totalPlaza / plazaMetaVentas) * 100 : 0;
    const plazaGananciaProgreso = plazaMetaGanancia > 0 ? ((totalPlaza - plazaExpenses) / plazaMetaGanancia) * 100 : 0;
    const colonialVentasProgreso = colonialMetaVentas > 0 ? (totalColonial / colonialMetaVentas) * 100 : 0;
    const colonialGananciaProgreso = colonialMetaGanancia > 0 ? ((totalColonial - colonialExpenses) / colonialMetaGanancia) * 100 : 0;
    const globalVentasProgreso = totalMetaVentas > 0 ? (totalGlobalIngresos / totalMetaVentas) * 100 : 0;
    const globalGananciaProgreso = totalMetaGanancia > 0 ? (totalGlobalMargen / totalMetaGanancia) * 100 : 0;

    return (
        <>
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-2xl text-primary-600">
                                <LayoutDashboard size={28} />
                            </div>
                            Comparativa de Hoteles
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-wider">An├ílisis entre Hotel Plaza y Hotel Colonial</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/mapa-habitaciones-consolidado')}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 w-full md:w-auto"
                        >
                            <Building2 size={18} />
                            Mapa Consolidado
                        </button>
                        <button
                            onClick={fetchCajaModal}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 w-full md:w-auto"
                        >
                            <Activity size={18} />
                            Movimientos Mes Actual
                        </button>
                        <button
                            onClick={() => setShowDetalleModal(true)}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 w-full md:w-auto"
                        >
                            <FileText size={18} />
                            Ver Detalle Diario
                        </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                            {PERIODOS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => seleccionarPeriodo(i)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${periodoActivo === i ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
                            <Calendar size={14} className="text-slate-400" />
                            <input type="date" className="bg-transparent text-[10px] font-bold border-none focus:ring-0 text-slate-700 p-0 w-24"
                                value={dates.inicio} onChange={e => { setDates({ ...dates, inicio: e.target.value }); setPeriodoActivo(-1); }} />
                            <span className="text-slate-300">ÔåÆ</span>
                            <input type="date" className="bg-transparent text-[10px] font-bold border-none focus:ring-0 text-slate-700 p-0 w-24"
                                value={dates.fin} onChange={e => { setDates({ ...dates, fin: e.target.value }); setPeriodoActivo(-1); }} />
                            <button onClick={fetchComparativeData} className="text-primary-600 hover:text-primary-800 transition" title="Actualizar">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCI├ôN MAESTRA: M├ëTRICAS CLAVE DE LA CADENA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. LIQUIDEZ CONSOLIDADA (Mejorado) */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[1.5rem] shadow-inner border border-white/10">
                                <DollarSign size={32} className="text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100/80">Liquidez Consolidada</span>
                                <h3 className="text-xl font-black tracking-tight">Total en Caja (+Base) Cadena</h3>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-6xl font-black tracking-tighter drop-shadow-2xl">
                                ${new Intl.NumberFormat().format(globalCashTotalConBase)}
                            </h2>
                            <div className="flex items-center gap-3 text-indigo-100/60 font-bold">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-indigo-600 flex items-center justify-center text-[8px] font-black">PZ</div>
                                    <div className="w-6 h-6 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-[8px] font-black">CL</div>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-black">Suma de todas las cajas y bases</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Hotel Plaza</p>
                                <p className="text-xl font-black">${new Intl.NumberFormat().format( (data?.plaza?.cash?.efectivo || 0) + (data?.plaza?.cash?.base || 0) )}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Hotel Colonial</p>
                                <p className="text-xl font-black">${new Intl.NumberFormat().format( (data?.colonial?.cash?.efectivo || 0) + (data?.colonial?.cash?.base || 0) )}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. OCUPACI├ôN GRUPAL (NUEVO - Estilo imagen 1) */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between group transition-all hover:shadow-2xl">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ocupaci├│n Grupal</span>
                            <Users size={20} className="text-primary-500 opacity-20" />
                        </div>
                        
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-7xl font-black tracking-tighter text-indigo-600">
                                {globalOccupancyPercent.toFixed(1)}%
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacidad Total ({globalOcupadas} de {globalTotalHabitaciones})</span>
                        </div>
                    </div>

                    <div className="space-y-8 mt-10">
                        {/* Plaza Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hotel Plaza</span>
                                <div className="text-right">
                                    <span className="text-sm font-black text-blue-600">
                                        {((data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-2">
                                        ({data?.plaza?.rooms?.ocupadas} de {data?.plaza?.rooms?.total})
                                    </span>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1 shadow-inner">
                                <div 
                                    className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-1000 ease-out" 
                                    style={{ width: `${(data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100}%` }} 
                                />
                            </div>
                        </div>

                        {/* Colonial Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hotel Colonial</span>
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-600">
                                        {((data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-2">
                                        ({data?.colonial?.rooms?.ocupadas} de {data?.colonial?.rooms?.total})
                                    </span>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1 shadow-inner">
                                <div 
                                    className="h-full bg-slate-600 rounded-full shadow-[0_0_10px_rgba(71,85,105,0.3)] transition-all duration-1000 ease-out" 
                                    style={{ width: `${(data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BANNER: SALDO PENDIENTE POR COBRAR --- */}
            {totalSaldoPendiente > 0 && (
                <div className="bg-red-600 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md shadow-red-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={22} className="text-white flex-shrink-0" />
                        <div>
                            <span className="text-white font-black text-sm uppercase tracking-wide">Saldo Pendiente por Cobrar</span>
                            <div className="flex flex-wrap gap-5 mt-0.5">
                                {plazaSaldoPendiente > 0 && (
                                    <span className="text-red-100 text-xs font-bold">
                                        Plaza: ${new Intl.NumberFormat().format(plazaSaldoPendiente)} · {plazaSaldoCount} habitación{plazaSaldoCount !== 1 ? 'es' : ''}
                                    </span>
                                )}
                                {colonialSaldoPendiente > 0 && (
                                    <span className="text-red-100 text-xs font-bold">
                                        Colonial: ${new Intl.NumberFormat().format(colonialSaldoPendiente)} · {colonialSaldoCount} habitación{colonialSaldoCount !== 1 ? 'es' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-white font-black text-2xl">${new Intl.NumberFormat().format(totalSaldoPendiente)}</div>
                </div>
            )}

            {/* --- SECCIÓN: SEGUIMIENTO DE METAS MENSUALES --- */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Seguimiento de Metas Mensuales</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Cumplimiento de objetivos de facturación y utilidad</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 block text-center">Consolidado Cadena</span>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cumplimiento Ventas</span>
                                        <span className="text-xs font-black text-slate-800">${new Intl.NumberFormat().format(totalGlobalIngresos)} / ${new Intl.NumberFormat().format(totalMetaVentas)}</span>
                                    </div>
                                    <span className={`text-sm font-black ${globalVentasProgreso >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{globalVentasProgreso.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full transition-all duration-1000 ${globalVentasProgreso >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, globalVentasProgreso)}%` }} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cumplimiento Ganancia</span>
                                        <span className="text-xs font-black text-slate-800">${new Intl.NumberFormat().format(totalGlobalMargen)} / ${new Intl.NumberFormat().format(totalMetaGanancia)}</span>
                                    </div>
                                    <span className={`text-sm font-black ${globalGananciaProgreso >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{globalGananciaProgreso.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full transition-all duration-1000 ${globalGananciaProgreso >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, globalGananciaProgreso)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Plaza</div>
                            <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Hotel Balcón Plaza</h4>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Progreso Ventas</span>
                                        <span className="text-blue-600">${totalPlaza.toLocaleString('es-CO')} &nbsp;·&nbsp; {plazaVentasProgreso.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, plazaVentasProgreso)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Progreso Ganancia</span>
                                        <span className="text-emerald-500">${(totalPlaza - plazaExpenses).toLocaleString('es-CO')} &nbsp;·&nbsp; {plazaGananciaProgreso.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, plazaGananciaProgreso)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Colonial</div>
                            <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Hotel Balcón Colonial</h4>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Progreso Ventas</span>
                                        <span className="text-indigo-600">${totalColonial.toLocaleString('es-CO')} &nbsp;·&nbsp; {colonialVentasProgreso.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, colonialVentasProgreso)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Progreso Ganancia</span>
                                        <span className="text-emerald-500">${(totalColonial - colonialExpenses).toLocaleString('es-CO')} &nbsp;·&nbsp; {colonialGananciaProgreso.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, colonialGananciaProgreso)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consolidado General (Restaurado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Ingresos Globales */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ingresos Globales</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(totalGlobalIngresos)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                {/* 1b. Ventas Tienda Global */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ventas Tienda Global</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(totalGlobalTienda)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                {/* 2. Egresos Globales */}
                <div className="bg-gradient-to-br from-rose-600 to-rose-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Egresos Globales</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-white">${new Intl.NumberFormat().format(totalGlobalEgresos)}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                </div>

                {/* 3. Ganancia Global */}
                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${totalGlobalMargen >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${totalGlobalMargen >= 0 ? 'text-emerald-600/60' : 'text-rose-600/60'}`}>Ganancia Global</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalGlobalMargen >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {globalMargenPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className={`text-3xl font-black ${totalGlobalMargen >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            ${new Intl.NumberFormat().format(totalGlobalMargen)}
                        </h4>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${totalGlobalMargen >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {totalGlobalMargen >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                    </div>
                </div>

                {/* 4. Promedio Ingreso Diario */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Promedio Ingreso Diario</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black">${new Intl.NumberFormat().format(Math.round(globalDailyAvg))}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>

                {/* 5. Gasto Promedio Diario */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-100">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Gasto Promedio Diario</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-white">${new Intl.NumberFormat().format(Math.round(globalExpensesAvg))}</h4>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                </div>

                {/* 6. Ganancia Promedio Diario */}
                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${globalProfitAvg >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${globalProfitAvg >= 0 ? 'text-indigo-600/60' : 'text-rose-600/60'}`}>Ganancia Promedio Diario</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className={`text-3xl font-black ${globalProfitAvg >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                            ${new Intl.NumberFormat().format(Math.round(globalProfitAvg))}
                        </h4>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${globalProfitAvg >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                            {globalProfitAvg >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                    </div>
                </div>

                {/* Fila 2: Operativo */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Libres Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                            {globalFreePercent.toFixed(1)}% Disponibles
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-emerald-600">{globalDisponibles}</h4>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. Ocupadas Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                            {globalOccupancyPercent.toFixed(1)}% Ocupaci├│n
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-rose-600">{globalOcupadas}</h4>
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hab. En Aseo Totales</p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                            {globalAseoPercent.toFixed(1)}% En Aseo
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-amber-600">{globalAseo}</h4>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Brush size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCI├ôN INTELIGENTE: PULSO DE LA CADENA --- */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pulso de la Cadena</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">An├ílisis Comparativo Directo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} /> Rendimiento de Ventas
                            </h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-[#2563eb]" /> Plaza
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-[#6366f1]" /> Colonial
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Total Ingresos', plaza: totalPlaza, colonial: totalColonial },
                                    { name: 'Ventas Tienda', plaza: shopPlaza, colonial: shopColonial },
                                    { name: 'Gastos', plaza: plazaExpenses, colonial: colonialExpenses }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => `$${new Intl.NumberFormat().format(val)}`}
                                    />
                                    <Bar dataKey="plaza" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={35} />
                                    <Bar dataKey="colonial" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={35} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <PieChartIcon size={16} /> Mix de Ingresos
                            </h4>
                            <div className="h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeMixData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {incomeMixData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val) => `$${new Intl.NumberFormat().format(val)}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Ingresos</span>
                                    <span className="text-lg font-black text-slate-900 tracking-tighter">
                                        {((totalPlaza / (totalGlobalIngresos || 1)) * 100).toFixed(0)}% <span className="text-[9px] text-primary-600">PZ</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupaci├│n Plaza</span>
                                    <span className="text-sm font-black text-blue-600">{((data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(data?.plaza?.rooms?.ocupadas / (data?.plaza?.rooms?.total || 1)) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupaci├│n Colonial</span>
                                    <span className="text-sm font-black text-indigo-600">{((data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(data?.colonial?.rooms?.ocupadas / (data?.colonial?.rooms?.total || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HotelCard 
                    hotelName="Hotel Balc├│n Plaza"
                    income={totalPlaza}
                    expenses={plazaExpenses}
                    dailyAvg={plazaDailyAvg}
                    expensesAvg={plazaExpensesAvg}
                    profitAvg={plazaProfitAvg}
                    shopSales={shopPlaza}
                    rooms={data?.plaza.rooms}
                    cash={data?.plaza.cash}
                    color="primary"
                />
                <HotelCard 
                    hotelName="Hotel Balc├│n Colonial"
                    income={totalColonial}
                    expenses={colonialExpenses}
                    dailyAvg={colonialDailyAvg}
                    expensesAvg={colonialExpensesAvg}
                    profitAvg={colonialProfitAvg}
                    shopSales={shopColonial}
                    rooms={data?.colonial.rooms}
                    cash={data?.colonial.cash}
                    color="slate"
                />
            </div>

            {/* Income Comparison Chart */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Comparativa de Ingresos</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Evoluci├│n de ingresos por hotel</p>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10}}
                                tickFormatter={(val) => `$${new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(val)}`}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, '']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar name="Plaza" dataKey="plazaIngresos" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
                            <Bar name="Colonial" dataKey="colonialIngresos" fill="#64748b" radius={[6, 6, 0, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Profit Margin Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Plaza Profit Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Evoluci├│n de Margen (Plaza)</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Margen Neto por periodo</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Total</p>
                            <p className="text-2xl font-black text-emerald-500">${new Intl.NumberFormat().format(totalPlaza - plazaExpenses)}</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPlazaMargen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                    formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, 'Margen']}
                                />
                                <Area type="monotone" dataKey="plazaMargen" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPlazaMargen)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Colonial Profit Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Evoluci├│n de Margen (Colonial)</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Margen Neto por periodo</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Total</p>
                            <p className="text-2xl font-black text-indigo-500">${new Intl.NumberFormat().format(totalColonial - colonialExpenses)}</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorColonialMargen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}}
                                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold', padding: '16px' }}
                                    formatter={(value) => [`$${new Intl.NumberFormat().format(value)}`, 'Margen']}
                                />
                                <Area type="monotone" dataKey="colonialMargen" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorColonialMargen)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 4. Fidelidad de Clientes Consolidada */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 translate-x-1/4">
                    <Heart size={200} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-rose-50 text-rose-500 rounded-2xl">
                                <Heart size={24} />
                            </div>
                            Fidelidad de Clientes Consolidada
                        </h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Clientes con m├ís visitas en ambas sedes</p>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                        Ver Todos los Clientes <Users size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {statsConsolidadas?.topClients?.slice(0, 5).map((client, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                                    <Crown size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas</span>
                                    <p className="text-xl font-black text-slate-900 leading-none mt-1">{client.count}</p>
                                </div>
                            </div>
                            <h4 className="font-black text-slate-800 text-sm line-clamp-1 mb-1">{client.nombre}</h4>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">ID: {client.documento}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Ranking de Procedencia (NUEVO) */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ranking de Procedencia</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">┬┐De d├│nde vienen nuestros clientes?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsConsolidadas?.topOrigins?.slice(0, 8).map((origin, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                #{idx + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad/Municipio</p>
                                <p className="text-sm font-black text-slate-800">{origin.nombre}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{origin.count} <span className="text-[9px]">Visitas</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fila de M├│dulos Inteligentes Consolidados */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 1. Panel de Alertas Globales */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Bell size={20} className="text-rose-500 animate-pulse" />
                                Alertas Globales
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Operatividad y Stock</p>
                        </div>
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full border border-rose-100">
                            {(statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').length} ACTIVAS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {(statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').length > 0 ? (
                            (statsConsolidadas?.alerts || []).filter(a => a.type !== 'PRICE' && a.type !== 'TIME').map((alert, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        alert.type === 'STOCK' ? 'bg-amber-100 text-amber-600' : 
                                        alert.type === 'PAGO' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {alert.type === 'STOCK' ? <Zap size={16} /> : alert.type === 'PAGO' ? <DollarSign size={16} /> : <Info size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alert.hotel}</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Ahora</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5 line-clamp-2">{alert.message || alert.msg}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-2">
                                <Sparkles size={40} className="opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Sin alertas operativas</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* 2. Pron├│stico de Ingresos */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Target size={120} />
                    </div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6 backdrop-blur-md">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Pron├│stico de Ingresos</h3>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Pr├│ximos 7 d├¡as (Reservas + Saldos)</p>
                        </div>

                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-2">
                                ${new Intl.NumberFormat().format(statsConsolidadas?.forecast || 0)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <TrendingUp size={12} />
                                ESTIMACI├ôN BASADA EN DATOS
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Ranking Habitaciones Estrella */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Trophy size={20} className="text-amber-500" />
                                Habitaciones Estrella
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Top 5 m├ís rentables</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {statsConsolidadas?.rankingHabs?.slice(0, 5).map((hab, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                    idx === 0 ? 'bg-amber-100 text-amber-600' : 
                                    idx === 1 ? 'bg-slate-100 text-slate-600' : 
                                    idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-black text-slate-700">Hab #{hab.numero} <span className="text-[9px] text-slate-400">({hab.hotel})</span></span>
                                        <span className="text-xs font-black text-emerald-600">${new Intl.NumberFormat().format(hab.income)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                hab.hotel === 'Plaza' ? 'bg-primary-500' : 'bg-slate-700'
                                            }`} 
                                            style={{ width: `${(hab.income / (statsConsolidadas?.rankingHabs?.[0]?.income || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Secci├│n de Auditor├¡a de Tiempos (Check-outs Vencidos) */}
            <div className="mt-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                                <Clock size={24} />
                            </div>
                            Auditor├¡a de Tiempos (Check-outs Vencidos)
                        </h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Hu├®spedes que han superado su hora de salida programada</p>
                    </div>
                    <div className="px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100 text-right">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Vencimientos Hoy</p>
                        <p className="text-xl font-black text-rose-600">{(statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').length}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">Check-out Programado</th>
                                <th className="px-6 py-4">Hab</th>
                                <th className="px-6 py-4">Hu├®sped</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').length > 0 ? (
                                (statsConsolidadas?.alerts || []).filter(a => a.type === 'TIME').map((alert, idx) => {
                                    const details = alert.details || {};
                                    return (
                                        <tr key={idx} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group rounded-2xl">
                                            <td className="px-6 py-4 first:rounded-l-2xl">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black text-white ${alert.hotel.includes('Plaza') ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-700 shadow-lg shadow-slate-100'}`}>
                                                    {alert.hotel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit">
                                                        {details.fechaSalidaProgramada ? format(parseISO(details.fechaSalidaProgramada), 'dd/MM/yyyy HH:mm') : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-900 text-sm">#{details.habitacion}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{details.huespedTitular}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {details.nombreEmpresa ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                        {details.nombreEmpresa}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[10px] font-bold">Particular</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right last:rounded-r-2xl">
                                                <button 
                                                    onClick={() => {
                                                        const currentHost = window.location.hostname;
                                                        const targetIsPlaza = alert.hotel.includes('Plaza');
                                                        const isPlazaHost = currentHost.includes('plaza') || currentHost === 'localhost';
                                                        if (targetIsPlaza === isPlazaHost) {
                                                            navigate(`/mapa-habitaciones?search=${details.id}`);
                                                        } else {
                                                            const baseUrl = targetIsPlaza ? 'https://hotelbalconplaza.com' : 'https://hotelbalconcolonial.com';
                                                            window.location.href = `${baseUrl}/mapa-habitaciones?search=${details.id}`;
                                                        }
                                                    }}
                                                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group-hover:scale-110 shadow-sm"
                                                    title="Ver en Mapa"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300 space-y-3">
                                            <CheckCircle size={48} className="opacity-20 text-emerald-500" />
                                            <p className="text-sm font-black uppercase tracking-widest">Todos los check-outs est├ín al d├¡a</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Nueva Secci├│n de Anomal├¡as de Precio - Pantalla Completa abajo */}
            <div className="mt-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            Auditor├¡a de Anomal├¡as de Precio
                        </h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Reporte detallado de desviaciones vs precios base recomendados</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Casos Detectados</p>
                            <p className="text-xl font-black text-orange-600">{(statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').length}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Hab</th>
                                <th className="px-6 py-4">Hu├®sped</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4 text-right">Referencia</th>
                                <th className="px-6 py-4 text-right">Cobrado</th>
                                <th className="px-6 py-4 text-center">Desviaci├│n</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').length > 0 ? (
                                (statsConsolidadas?.alerts || []).filter(a => a.type === 'PRICE').map((alert, idx) => {
                                    const details = alert.details || {};
                                    return (
                                        <tr key={idx} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group rounded-2xl">
                                            <td className="px-6 py-4 first:rounded-l-2xl">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black text-white ${alert.hotel.includes('Plaza') ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-700 shadow-lg shadow-slate-100'}`}>
                                                    {alert.hotel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-500 text-xs">
                                                {details.fecha ? format(parseISO(details.fecha), 'dd/MM/yyyy HH:mm') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-900 text-sm">#{details.habitacion}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{details.huespedTitular}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{details.huespedes} personas</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {details.nombreEmpresa ? (
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                        {details.nombreEmpresa}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[10px] font-bold">Particular</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-400 text-sm">${new Intl.NumberFormat().format(details.precioRecomendado || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-slate-900 text-sm">${new Intl.NumberFormat().format(details.precioCobrado || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-xl text-xs font-black shadow-sm">
                                                    -{details.diferenciaPct}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right last:rounded-r-2xl">
                                                <button 
                                                    onClick={() => {
                                                        const currentHost = window.location.hostname;
                                                        const targetIsPlaza = alert.hotel.includes('Plaza');
                                                        const isPlazaHost = currentHost.includes('plaza') || currentHost === 'localhost';
                                                        
                                                        // Si estamos en el mismo hotel, usamos navegaci├│n interna (SPA)
                                                        // De lo contrario, usamos URL absoluta
                                                        if (targetIsPlaza === isPlazaHost) {
                                                            navigate(`/mapa-habitaciones?search=${details.id}`);
                                                        } else {
                                                            const baseUrl = targetIsPlaza ? 'https://hotelbalconplaza.com' : 'https://hotelbalconcolonial.com';
                                                            window.location.href = `${baseUrl}/mapa-habitaciones?search=${details.id}`;
                                                        }
                                                    }}
                                                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group-hover:scale-110 shadow-sm"
                                                    title="Ver en Mapa"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300 space-y-3">
                                            <ShieldCheck size={48} className="opacity-20" />
                                            <p className="text-sm font-black uppercase tracking-widest">No se han detectado anomal├¡as de precio en este periodo</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* Modal Movimientos Mes Actual Última Semana */}
        {showCajaModal && (
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCajaModal(false)}>
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden mt-2 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                <Activity size={18} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Movimientos Mes Actual</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mes actual · {format(startOfMonth(new Date()), 'dd/MM/yyyy')} – {format(new Date(), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCajaModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800 text-xl font-bold flex-shrink-0">✕</button>
                    </div>
                    <div className="overflow-y-auto flex-1 px-3 sm:px-6 py-4">
                        {cajaModalLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw className="animate-spin text-emerald-500" size={36} />
                            </div>
                        ) : (
                            <div>
                                {/* Resumen */}
                                {(() => {
                                    const ingresos = cajaModalData.filter(m => (m.monto || 0) > 0);
                                    const egresos = cajaModalData.filter(m => (m.monto || 0) < 0);
                                    const totalIng = ingresos.reduce((s, m) => s + (m.monto || 0), 0);
                                    const totalEgr = Math.abs(egresos.reduce((s, m) => s + (m.monto || 0), 0));
                                    const totalNeto = totalIng - totalEgr;
                                    const plazaIng = ingresos.filter(m => (m.hotel||'').toLowerCase().includes('plaza')).reduce((s, m) => s + (m.monto || 0), 0);
                                    const colonialIng = ingresos.filter(m => (m.hotel||'').toLowerCase().includes('colonial')).reduce((s, m) => s + (m.monto || 0), 0);
                                    return (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                                            <div className="bg-indigo-50 rounded-xl p-3">
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Ing. Plaza</p>
                                                <p className="text-sm font-black text-indigo-700">${new Intl.NumberFormat().format(plazaIng)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ing. Colonial</p>
                                                <p className="text-sm font-black text-slate-700">${new Intl.NumberFormat().format(colonialIng)}</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Total Ingresos</p>
                                                <p className="text-sm font-black text-emerald-700">${new Intl.NumberFormat().format(plazaIng + colonialIng)}</p>
                                            </div>
                                            <div className="bg-rose-50 rounded-xl p-3">
                                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Egresos</p>
                                                <p className="text-sm font-black text-rose-700">${new Intl.NumberFormat().format(totalEgr)}</p>
                                            </div>
                                            <div className={`rounded-xl p-3 ${totalNeto >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${totalNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Neto</p>
                                                <p className={`text-sm font-black ${totalNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${new Intl.NumberFormat().format(totalNeto)}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* Tabla movimientos */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Hotel</th>
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Fecha</th>
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Tipo</th>
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Descripción</th>
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Usuario</th>
                                                <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Medio</th>
                                                <th className="text-right px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Valor</th>
                                            </tr>
                                            <tr className="bg-white border-b border-slate-100">
                                                {['hotel','fecha','tipo','descripcion','usuario','medio','valor'].map(col => (
                                                    <td key={col} className="px-2 py-1">
                                                        <input
                                                            type="text"
                                                            placeholder="—"
                                                            value={cajaFilters[col]}
                                                            onChange={e => setCajaFilters(f => ({ ...f, [col]: e.target.value }))}
                                                            className="w-full text-[9px] font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-slate-50 placeholder-slate-300"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cajaModalData.filter(m => {
                                                const isPlaza = (m.hotel||'').toLowerCase().includes('plaza');
                                                const hotelLabel = isPlaza ? 'plaza' : 'colonial';
                                                const fechaStr = m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit' }) : '';
                                                const f = cajaFilters;
                                                return (
                                                    (!f.hotel || hotelLabel.includes(f.hotel.toLowerCase())) &&
                                                    (!f.fecha || fechaStr.includes(f.fecha)) &&
                                                    (!f.tipo || (m.tipo||'').toLowerCase().includes(f.tipo.toLowerCase())) &&
                                                    (!f.descripcion || (m.descripcion||'').toLowerCase().includes(f.descripcion.toLowerCase())) &&
                                                    (!f.usuario || (m.usuario||'').toLowerCase().includes(f.usuario.toLowerCase())) &&
                                                    (!f.medio || (m.medioPago||'').toLowerCase().includes(f.medio.toLowerCase())) &&
                                                    (!f.valor || String(Math.abs(m.monto||0)).includes(f.valor.replace(/\./g,'')))
                                                );
                                            }).map((m, i) => {
                                                const isPlaza = (m.hotel||'').toLowerCase().includes('plaza');
                                                const isEgreso = (m.monto || 0) < 0;
                                                const today = new Date();
                                                const mDate = m.fecha ? new Date(m.fecha) : null;
                                                const isToday = mDate && mDate.getFullYear() === today.getFullYear() && mDate.getMonth() === today.getMonth() && mDate.getDate() === today.getDate();
                                                return (
                                                    <tr key={i} className={`border-b transition-colors ${isToday ? 'bg-amber-50 border-amber-100 hover:bg-amber-100/60' : 'border-slate-50 hover:bg-slate-50/50'}`}>
                                                        <td className="px-3 py-2">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isPlaza ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                                                {isPlaza ? 'PLAZA' : 'COLONIAL'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-slate-600 whitespace-nowrap">
                                                            {m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase">{m.tipo}</span>
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-slate-700 max-w-[180px] truncate">{m.descripcion}</td>
                                                        <td className="px-3 py-2 font-bold text-slate-500 whitespace-nowrap">{m.usuario}</td>
                                                        <td className="px-3 py-2">
                                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">{m.medioPago}</span>
                                                        </td>
                                                        <td className={`px-3 py-2 text-right font-black ${isEgreso ? 'text-red-600' : 'text-emerald-600'}`}>
                                                            {isEgreso ? '-' : '+'}${new Intl.NumberFormat().format(Math.abs(m.monto || 0))}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {cajaModalData.length === 0 && (
                                                <tr><td colSpan={7} className="text-center py-10 text-slate-300 font-black text-xs uppercase">Sin movimientos para el período</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Modal Ver Detalle Diario */}
        {showDetalleModal && (
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetalleModal(false)}>
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden mt-2 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <FileText size={18} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Detalle Diario Consolidado</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    Período: {dates.inicio} – {dates.fin}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowDetalleModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800 text-xl font-bold flex-shrink-0">✕</button>
                    </div>
                    <div className="overflow-y-auto flex-1 px-3 sm:px-6 py-4">
                        {(() => {
                            const plazaH = data?.plaza?.history || [];
                            const colonialH = data?.colonial?.history || [];
                            const map = new Map();
                            plazaH.forEach(p => map.set(p.label, { label: p.label, sortKey: p.sortKey, plaza: p, colonial: { ingresos: 0, egresos: 0, margen: 0 } }));
                            colonialH.forEach(c => {
                                const ex = map.get(c.label) || { label: c.label, sortKey: c.sortKey, plaza: { ingresos: 0, egresos: 0, margen: 0 }, colonial: c };
                                ex.colonial = c;
                                map.set(c.label, ex);
                            });
                            const rows = Array.from(map.values()).sort((a, b) => {
                                const va = a.sortKey || a.label;
                                const vb = b.sortKey || b.label;
                                return typeof va === 'string' ? vb.localeCompare(va) : vb - va;
                            });
                            const totPlazaIng = rows.reduce((s, r) => s + (r.plaza.ingresos || 0), 0);
                            const totColonialIng = rows.reduce((s, r) => s + (r.colonial.ingresos || 0), 0);
                            const totPlazaEgr = rows.reduce((s, r) => s + (r.plaza.egresos || 0), 0);
                            const totColonialEgr = rows.reduce((s, r) => s + (r.colonial.egresos || 0), 0);
                            const totNeto = (totPlazaIng + totColonialIng) - (totPlazaEgr + totColonialEgr);
                            return (
                                <div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
                                        <div className="bg-indigo-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Ing. Plaza</p>
                                            <p className="text-sm font-black text-indigo-700">${new Intl.NumberFormat().format(totPlazaIng)}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ing. Colonial</p>
                                            <p className="text-sm font-black text-slate-700">${new Intl.NumberFormat().format(totColonialIng)}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Total Ingresos</p>
                                            <p className="text-sm font-black text-emerald-700">${new Intl.NumberFormat().format(totPlazaIng + totColonialIng)}</p>
                                        </div>
                                        <div className="bg-rose-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Egresos</p>
                                            <p className="text-sm font-black text-rose-700">${new Intl.NumberFormat().format(totPlazaEgr + totColonialEgr)}</p>
                                        </div>
                                        <div className={`rounded-xl p-3 ${totNeto >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${totNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Neto</p>
                                            <p className={`text-sm font-black ${totNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${new Intl.NumberFormat().format(totNeto)}</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Fecha</th>
                                                    <th className="text-right px-3 py-3 font-black text-indigo-500 uppercase tracking-widest text-[9px]">Plaza Ing.</th>
                                                    <th className="text-right px-3 py-3 font-black text-indigo-400 uppercase tracking-widest text-[9px]">Plaza Egr.</th>
                                                    <th className="text-right px-2 py-3 font-black text-indigo-600 uppercase tracking-widest text-[9px]">Plaza Neto</th>
                                                    <th className="text-right px-2 py-3 font-black text-slate-300 uppercase tracking-widest text-[9px]">%</th>
                                                    <th className="text-right px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Colonial Ing.</th>
                                                    <th className="text-right px-3 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Colonial Egr.</th>
                                                    <th className="text-right px-2 py-3 font-black text-slate-600 uppercase tracking-widest text-[9px]">Colonial Neto</th>
                                                    <th className="text-right px-2 py-3 font-black text-slate-300 uppercase tracking-widest text-[9px]">%</th>
                                                    <th className="text-right px-3 py-3 font-black text-emerald-500 uppercase tracking-widest text-[9px]">Total Ing.</th>
                                                    <th className="text-right px-3 py-3 font-black text-rose-400 uppercase tracking-widest text-[9px]">Total Egr.</th>
                                                    <th className="text-right px-3 py-3 font-black text-emerald-600 uppercase tracking-widest text-[9px]">Total Neto</th>
                                                    <th className="text-right px-2 py-3 font-black text-slate-300 uppercase tracking-widest text-[9px]">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, i) => {
                                                    const plazaNeto = (row.plaza.ingresos || 0) - (row.plaza.egresos || 0);
                                                    const colonialNeto = (row.colonial.ingresos || 0) - (row.colonial.egresos || 0);
                                                    const totalIng = (row.plaza.ingresos || 0) + (row.colonial.ingresos || 0);
                                                    const totalEgr = (row.plaza.egresos || 0) + (row.colonial.egresos || 0);
                                                    const totalNeto = plazaNeto + colonialNeto;
                                                    const plazaPct = (row.plaza.ingresos || 0) > 0 ? (plazaNeto / row.plaza.ingresos) * 100 : 0;
                                                    const colonialPct = (row.colonial.ingresos || 0) > 0 ? (colonialNeto / row.colonial.ingresos) * 100 : 0;
                                                    const totalPct = totalIng > 0 ? (totalNeto / totalIng) * 100 : 0;
                                                    return (
                                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-2.5 font-black text-slate-700">{row.label}</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-slate-600">${new Intl.NumberFormat().format(row.plaza.ingresos || 0)}</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-rose-500">${new Intl.NumberFormat().format(row.plaza.egresos || 0)}</td>
                                                            <td className={`px-2 py-2.5 text-right font-black ${plazaNeto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${new Intl.NumberFormat().format(plazaNeto)}</td>
                                                            <td className="px-2 py-2.5 text-right font-bold text-slate-400 text-[9px]">{plazaPct.toFixed(0)}%</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-slate-600">${new Intl.NumberFormat().format(row.colonial.ingresos || 0)}</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-rose-500">${new Intl.NumberFormat().format(row.colonial.egresos || 0)}</td>
                                                            <td className={`px-2 py-2.5 text-right font-black ${colonialNeto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${new Intl.NumberFormat().format(colonialNeto)}</td>
                                                            <td className="px-2 py-2.5 text-right font-bold text-slate-400 text-[9px]">{colonialPct.toFixed(0)}%</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-emerald-600">${new Intl.NumberFormat().format(totalIng)}</td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-rose-500">${new Intl.NumberFormat().format(totalEgr)}</td>
                                                            <td className={`px-3 py-2.5 text-right font-black ${totalNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>${new Intl.NumberFormat().format(totalNeto)}</td>
                                                            <td className="px-2 py-2.5 text-right font-bold text-slate-400 text-[9px]">{totalPct.toFixed(0)}%</td>
                                                        </tr>
                                                    );
                                                })}
                                                {rows.length === 0 && (
                                                    <tr><td colSpan={13} className="text-center py-10 text-slate-300 font-black text-xs uppercase">Sin datos para el período</td></tr>
                                                )}
                                            </tbody>
                                            {rows.length > 0 && (() => {
                                                const tPlazaIng = rows.reduce((s,r) => s + (r.plaza.ingresos||0), 0);
                                                const tPlazaEgr = rows.reduce((s,r) => s + (r.plaza.egresos||0), 0);
                                                const tPlazaNeto = tPlazaIng - tPlazaEgr;
                                                const tColonialIng = rows.reduce((s,r) => s + (r.colonial.ingresos||0), 0);
                                                const tColonialEgr = rows.reduce((s,r) => s + (r.colonial.egresos||0), 0);
                                                const tColonialNeto = tColonialIng - tColonialEgr;
                                                const tTotalIng = tPlazaIng + tColonialIng;
                                                const tTotalEgr = tPlazaEgr + tColonialEgr;
                                                const tTotalNeto = tPlazaNeto + tColonialNeto;
                                                const tPlazaPct = tPlazaIng > 0 ? (tPlazaNeto/tPlazaIng)*100 : 0;
                                                const tColonialPct = tColonialIng > 0 ? (tColonialNeto/tColonialIng)*100 : 0;
                                                const tTotalPct = tTotalIng > 0 ? (tTotalNeto/tTotalIng)*100 : 0;
                                                return (
                                                    <tfoot>
                                                        <tr className="bg-slate-900 text-white">
                                                            <td className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Totales</td>
                                                            <td className="px-3 py-3 text-right font-black">${new Intl.NumberFormat().format(tPlazaIng)}</td>
                                                            <td className="px-3 py-3 text-right font-black text-rose-300">${new Intl.NumberFormat().format(tPlazaEgr)}</td>
                                                            <td className={`px-2 py-3 text-right font-black ${tPlazaNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${new Intl.NumberFormat().format(tPlazaNeto)}</td>
                                                            <td className="px-2 py-3 text-right text-[9px] font-bold text-slate-400">{tPlazaPct.toFixed(0)}%</td>
                                                            <td className="px-3 py-3 text-right font-black">${new Intl.NumberFormat().format(tColonialIng)}</td>
                                                            <td className="px-3 py-3 text-right font-black text-rose-300">${new Intl.NumberFormat().format(tColonialEgr)}</td>
                                                            <td className={`px-2 py-3 text-right font-black ${tColonialNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${new Intl.NumberFormat().format(tColonialNeto)}</td>
                                                            <td className="px-2 py-3 text-right text-[9px] font-bold text-slate-400">{tColonialPct.toFixed(0)}%</td>
                                                            <td className="px-3 py-3 text-right font-black text-emerald-400">${new Intl.NumberFormat().format(tTotalIng)}</td>
                                                            <td className="px-3 py-3 text-right font-black text-rose-300">${new Intl.NumberFormat().format(tTotalEgr)}</td>
                                                            <td className={`px-3 py-3 text-right font-black text-sm ${tTotalNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${new Intl.NumberFormat().format(tTotalNeto)}</td>
                                                            <td className="px-2 py-3 text-right text-[9px] font-bold text-slate-400">{tTotalPct.toFixed(0)}%</td>
                                                        </tr>
                                                    </tfoot>
                                                );
                                            })()}
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const HotelCard = ({ hotelName, income, expenses, dailyAvg, expensesAvg, profitAvg, shopSales, rooms, cash, color }) => {
    const margin = income - expenses;
    const marginPercent = income > 0 ? (margin / income) * 100 : 0;
    const themeColor = color === 'primary' ? 'blue' : 'slate';

    return (
        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl`}>
                            <Hotel size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{hotelName}</h2>
                    </div>
                    
                    {/* Ocupaci├│n Badge */}
                    <div className="flex gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <div className="flex flex-col items-center px-2.5 border-r border-slate-200">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Libres</span>
                            <span className="text-xs font-black text-emerald-600 leading-none mt-1">{rooms?.disponibles || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-2.5 border-r border-slate-200">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Ocupadas</span>
                            <span className="text-xs font-black text-rose-600 leading-none mt-1">{rooms?.ocupadas || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-2.5">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Aseo</span>
                            <span className="text-xs font-black text-amber-600 leading-none mt-1">{rooms?.aseo || 0}</span>
                        </div>
                    </div>
                </div>

                {/* New Cash Summary Section in Card */}
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Efectivo</span>
                        <span className="text-xs font-black text-emerald-600">${new Intl.NumberFormat().format(cash?.efectivo || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Nequi</span>
                        <span className="text-xs font-black text-indigo-600">${new Intl.NumberFormat().format(cash?.nequi || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Bancolombia</span>
                        <span className="text-xs font-black text-blue-600">${new Intl.NumberFormat().format(cash?.bancolombia || 0)}</span>
                    </div>
                </div>

                {/* Total en Caja (+Base) Individual */}
                <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] border-2 border-indigo-100 flex items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total en Caja (+Base)</p>
                        <h4 className="text-3xl font-black text-indigo-600 tracking-tighter">
                            ${new Intl.NumberFormat().format((cash?.efectivo || 0) + (cash?.base || 0))}
                        </h4>
                    </div>
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Lock size={22} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Totales</p>
                        <p className="text-3xl font-black text-slate-900">${new Intl.NumberFormat().format(income)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Egresos Totales</p>
                        <p className="text-3xl font-black text-slate-600">${new Intl.NumberFormat().format(expenses)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Ingreso</p>
                        <p className="text-3xl font-black text-primary-600">${new Intl.NumberFormat().format(Math.round(dailyAvg))}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Gasto</p>
                        <p className="text-3xl font-black text-orange-600">${new Intl.NumberFormat().format(Math.round(expensesAvg))}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Tienda</p>
                        <p className="text-3xl font-black text-indigo-600">${new Intl.NumberFormat().format(shopSales)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Ganancia</p>
                        <p className={`text-3xl font-black ${profitAvg >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            ${new Intl.NumberFormat().format(Math.round(profitAvg))}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Neto</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black ${margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ${new Intl.NumberFormat().format(margin)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {marginPercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-2xl ${margin >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {margin >= 0 ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparativaHoteles;
