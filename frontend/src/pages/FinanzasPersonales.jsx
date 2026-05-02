import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Plus, 
    Trash2, 
    PieChart as PieChartIcon, 
    PlusCircle,
    Lock,
    Settings,
    DollarSign,
    X,
    CheckCircle2,
    ClipboardList,
    Edit2
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import Swal from 'sweetalert2';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const FinanzasPersonales = () => {
    const { user } = useContext(AuthContext);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0, balance: 0 });
    const [metrics, setMetrics] = useState([]);
    const [config, setConfig] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, daily, goals
    const [goals, setGoals] = useState([]);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [goalForm, setGoalForm] = useState({ nombre: '', montoObjetivo: '', fechaLimite: '', color: '#10b981' });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/hotel-config');
                setConfig(res.data);
            } catch (error) {
                console.error('Error fetching hotel config:', error);
            }
        };
        fetchConfig();
    }, []);

    // Formulario Finanzas
    const [formData, setFormData] = useState({
        tipo: 'gasto',
        categoria_id: '',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    // Formulario Categoría
    const [showCatModal, setShowCatModal] = useState(false);
    const [newCat, setNewCat] = useState({ nombre: '', tipo: 'gasto', color: '#3b82f6' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [finRes, catRes, goalsRes] = await Promise.all([
                api.get('/personal-finance'),
                api.get('/personal-finance/categories'),
                api.get('/personal-finance/goals')
            ]);
            setData(finRes.data.data);
            setResumen(finRes.data.resumen);
            setMetrics(finRes.data.metricasGastos);
            setCategories(catRes.data);
            setGoals(goalsRes.data);
        } catch (error) {
            console.error('Error fetching personal finances:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        const validPin = config?.pinFinanzas || '123';
        if (pin === validPin) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            Swal.fire('Error', 'Clave incorrecta', 'error');
            setPin('');
        }
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();
        if (!formData.categoria_id || !formData.monto) {
            return Swal.fire('Atención', 'Complete los campos obligatorios', 'warning');
        }
        try {
            if (isEditing) {
                await api.put(`/personal-finance/${editingId}`, formData);
                Swal.fire('Éxito', 'Registro actualizado', 'success');
            } else {
                await api.post('/personal-finance', formData);
                Swal.fire('Éxito', 'Registro guardado', 'success');
            }
            setFormData({ 
                tipo: 'gasto',
                categoria_id: '',
                monto: '', 
                descripcion: '',
                fecha: new Date().toISOString().split('T')[0]
            });
            setIsEditing(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Error saving record:', error);
            const msg = error.response?.data?.mensaje || 'No se pudo guardar el registro';
            const details = error.response?.data?.error || '';
            Swal.fire('Error', `${msg}${details ? `: ${details}` : ''}`, 'error');
        }
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setEditingId(item._id);
        setFormData({
            tipo: item.tipo,
            categoria_id: item.categoria_id?._id || '',
            monto: item.monto,
            descripcion: item.descripcion,
            fecha: new Date(item.fecha).toISOString().split('T')[0]
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ 
            tipo: 'gasto',
            categoria_id: '',
            monto: '', 
            descripcion: '',
            fecha: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteRecord = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/personal-finance/${id}`);
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    const handleAddCategory = async () => {
        if (!newCat.nombre) return;
        try {
            await api.post('/personal-finance/categories', newCat);
            setShowCatModal(false);
            setNewCat({ nombre: '', tipo: 'gasto', color: '#3b82f6' });
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo crear la categoría', 'error');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.delete(`/personal-finance/categories/${id}`);
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.mensaje || 'Error al eliminar', 'error');
        }
    };

    // Procesar Reporte Diario
    const getDailyData = () => {
        const daily = data.reduce((acc, item) => {
            const date = new Date(item.fecha).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, ingresos: 0, gastos: 0, items: [] };
            }
            if (item.tipo === 'ingreso') {
                acc[date].ingresos += item.monto;
            } else {
                acc[date].gastos += item.monto;
            }
            acc[date].items.push(item);
            return acc;
        }, {});
        return Object.values(daily).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const dailyData = getDailyData();

    // --- Metas Logic ---
    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            if (editingGoal) {
                await api.put(`/personal-finance/goals/${editingGoal._id}`, goalForm);
                Swal.fire('Éxito', 'Meta actualizada', 'success');
            } else {
                await api.post('/personal-finance/goals', goalForm);
                Swal.fire('Éxito', 'Meta creada', 'success');
            }
            setShowGoalModal(false);
            setGoalForm({ nombre: '', montoObjetivo: '', fechaLimite: '', color: '#10b981' });
            setEditingGoal(null);
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la meta', 'error');
        }
    };

    const handleDeleteGoal = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar meta?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/personal-finance/goals/${id}`);
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    const handleContribute = async (goal) => {
        const { value: monto } = await Swal.fire({
            title: `Abonar a ${goal.nombre}`,
            input: 'number',
            inputLabel: 'Monto del abono ($)',
            inputPlaceholder: '0',
            showCancelButton: true,
            confirmButtonText: 'Registrar Abono',
            cancelButtonText: 'Cancelar'
        });

        if (monto) {
            try {
                await api.post(`/personal-finance/goals/${goal._id}/contribute`, { monto });
                Swal.fire('Éxito', 'Abono registrado', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo registrar el abono', 'error');
            }
        }
    };

    const openEditGoal = (goal) => {
        setEditingGoal(goal);
        setGoalForm({
            nombre: goal.nombre,
            montoObjetivo: goal.montoObjetivo,
            fechaLimite: goal.fechaLimite ? goal.fechaLimite.split('T')[0] : '',
            color: goal.color
        });
        setShowGoalModal(true);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-100">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Módulo Privado</h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Ingrese su clave de acceso</p>
                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <input 
                            type="password" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="---"
                            className="w-full text-center text-4xl font-black tracking-[1em] py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary-500 transition-all"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 active:scale-95"
                        >
                            Acceder ahora
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary-100 text-primary-600 rounded-[1.5rem] shadow-inner">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finanzas Personales</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Gestión Privada de Ingresos y Gastos</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => setShowCatModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                    >
                        <Settings size={16} />
                        Categorías
                    </button>
                    <button 
                        onClick={() => setIsAuthenticated(false)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Lock size={16} />
                        Bloquear
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 bg-slate-100/50 p-2 rounded-2xl w-fit">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: PieChartIcon },
                    { id: 'daily', label: 'Reporte Diario', icon: ClipboardList },
                    { id: 'goals', label: 'Metas (Idea)', icon: TrendingUp },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-primary-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <>
                    {/* Resume Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-l-8 border-l-emerald-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Ingresos</p>
                            <p className="text-3xl font-black text-emerald-600">${new Intl.NumberFormat('es-CO').format(resumen.ingresos)}</p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full uppercase tracking-tighter">
                                <TrendingUp size={12} /> Entradas de dinero
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-l-8 border-l-rose-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Gastos</p>
                            <p className="text-3xl font-black text-rose-600">${new Intl.NumberFormat('es-CO').format(resumen.gastos)}</p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-600 bg-rose-50 w-fit px-3 py-1 rounded-full uppercase tracking-tighter">
                                <TrendingDown size={12} /> Salidas de dinero
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-l-8 border-l-primary-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Balance Neto</p>
                            <p className={`text-3xl font-black ${resumen.balance >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
                                ${new Intl.NumberFormat('es-CO').format(resumen.balance)}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary-600 bg-primary-50 w-fit px-3 py-1 rounded-full uppercase tracking-tighter">
                                <DollarSign size={12} /> Saldo disponible
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Form & List */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isEditing ? <Edit2 size={20} className="text-amber-500" /> : <PlusCircle size={20} className="text-primary-500" />}
                                        {isEditing ? 'Editar Registro' : 'Nuevo Registro'}
                                    </div>
                                    {isEditing && (
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full hover:bg-slate-200 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </h3>
                                <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value, categoria_id: '' })}
                                        >
                                            <option value="gasto">Gasto</option>
                                            <option value="ingreso">Ingreso</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                            value={formData.categoria_id}
                                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categories.filter(c => c.tipo === formData.tipo).map(c => (
                                                <option key={c._id} value={c._id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                                        <input 
                                            type="number"
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                            placeholder="0"
                                            value={formData.monto}
                                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                                        <input 
                                            type="date"
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                            value={formData.fecha}
                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                            placeholder="¿En qué gastaste o de dónde vino?"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-2">
                                        <button className={`w-full py-4 ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95`}>
                                            {isEditing ? 'Actualizar Registro' : 'Guardar Registro'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                                    <ClipboardList size={20} className="text-slate-400" /> Últimos Movimientos
                                </h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {data.map(item => (
                                        <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl ${item.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {item.tipo === 'ingreso' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">{item.descripcion}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {item.categoria_id?.nombre || 'General'} • {new Date(item.fecha).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className={`text-sm font-black ${item.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.tipo === 'ingreso' ? '+' : '-'}${new Intl.NumberFormat('es-CO').format(item.monto)}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => handleEditClick(item)}
                                                        className="p-2 text-slate-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteRecord(item._id)}
                                                        className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Metrics & Charts */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
                                    <PieChartIcon size={20} className="text-primary-500" /> Distribución de Gastos
                                </h3>
                                <div className="h-[300px]">
                                    {metrics.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={metrics}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {metrics.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">
                                            No hay datos suficientes para graficar
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-500" /> Comparativa Mensual
                                </h3>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[{ name: 'Estado Actual', Ingresos: resumen.ingresos, Gastos: resumen.gastos }]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" hide />
                                            <YAxis fontSize={10} tickFormatter={(val) => `$${val/1000}k`} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="Ingresos" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                                            <Bar dataKey="Gastos" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'daily' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
                        <ClipboardList size={24} className="text-primary-500" /> Reporte Diario Detallado
                    </h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                    <th className="pb-2 pl-6">Fecha</th>
                                    <th className="pb-2">Ingresos</th>
                                    <th className="pb-2">Gastos</th>
                                    <th className="pb-2">Balance</th>
                                    <th className="pb-2">Movimientos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map((day) => (
                                    <tr key={day.date} className="bg-slate-50 group hover:bg-slate-100 transition-all rounded-3xl overflow-hidden">
                                        <td className="py-5 pl-6 rounded-l-2xl">
                                            <p className="text-sm font-black text-slate-900">{new Date(day.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        </td>
                                        <td className="py-5">
                                            <p className="text-sm font-bold text-emerald-600">${new Intl.NumberFormat('es-CO').format(day.ingresos)}</p>
                                        </td>
                                        <td className="py-5">
                                            <p className="text-sm font-bold text-rose-600">${new Intl.NumberFormat('es-CO').format(day.gastos)}</p>
                                        </td>
                                        <td className="py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${day.ingresos - day.gastos >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                ${new Intl.NumberFormat('es-CO').format(day.ingresos - day.gastos)}
                                            </span>
                                        </td>
                                        <td className="py-5 pr-6 rounded-r-2xl">
                                            <div className="flex -space-x-2">
                                                {day.items.slice(0, 5).map((item, i) => (
                                                    <div 
                                                        key={i} 
                                                        title={item.descripcion}
                                                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${item.tipo === 'ingreso' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                                                    >
                                                        {item.tipo === 'ingreso' ? '+' : '-'}
                                                    </div>
                                                ))}
                                                {day.items.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        +{day.items.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'goals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp size={24} className="text-emerald-500" /> Mis Metas de Ahorro
                            </h3>
                            <button 
                                onClick={() => {
                                    setEditingGoal(null);
                                    setGoalForm({ nombre: '', montoObjetivo: '', fechaLimite: '', color: '#10b981' });
                                    setShowGoalModal(true);
                                }}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-10">
                            {goals.length > 0 ? goals.map((goal) => {
                                const porc = Math.min(Math.round((goal.montoActual / goal.montoObjetivo) * 100), 100);
                                return (
                                    <div key={goal._id} className="group relative">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900">{goal.nombre}</p>
                                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                        <button onClick={() => openEditGoal(goal)} className="p-1 text-slate-400 hover:text-amber-500 transition-colors"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDeleteGoal(goal._id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objetivo: ${new Intl.NumberFormat('es-CO').format(goal.montoObjetivo)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black" style={{ color: goal.color }}>{porc}%</p>
                                                <p className="text-[9px] font-bold text-slate-400">Ahorrado: ${new Intl.NumberFormat('es-CO').format(goal.montoActual)}</p>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000 shadow-sm" 
                                                style={{ width: `${porc}%`, backgroundColor: goal.color }} 
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <p className="text-[10px] font-bold text-slate-400 italic">
                                                {goal.montoActual >= goal.montoObjetivo ? '¡Meta cumplida! 🎉' : `Faltan $${new Intl.NumberFormat('es-CO').format(goal.montoObjetivo - goal.montoActual)}`}
                                            </p>
                                            <button 
                                                onClick={() => handleContribute(goal)}
                                                className="text-[10px] font-black uppercase text-primary-600 hover:underline"
                                            >
                                                + Abonar Dinero
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Aún no has creado metas de ahorro</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Próximas Mejoras</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Settings size={20} className="text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Gastos Recurrentes</p>
                                        <p className="text-xs text-slate-400 mt-1 font-medium">Programar facturas mensuales (Arriendo, Internet, Netflix) para que el sistema te recuerde o los registre automáticamente.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <DollarSign size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Presupuestos por Categoría</p>
                                        <p className="text-xs text-slate-400 mt-1 font-medium">Definir un límite de gasto mensual por categoría (ej: "Mecato: $200.000") y recibir alertas visuales.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <ClipboardList size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Exportación Total</p>
                                        <p className="text-xs text-slate-400 mt-1 font-medium">Descargar todos tus movimientos en Excel o PDF con un solo clic para tu contador.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl" />
                    </div>
                </div>
            )}

            {/* Goal Modal */}
            {showGoalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {editingGoal ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
                            </h3>
                            <button onClick={() => setShowGoalModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddGoal} className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Meta</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej: Vacaciones 2026"
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={goalForm.nombre}
                                    onChange={(e) => setGoalForm({ ...goalForm, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Objetivo ($)</label>
                                <input 
                                    type="number" 
                                    required
                                    placeholder="0"
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                    value={goalForm.montoObjetivo}
                                    onChange={(e) => setGoalForm({ ...goalForm, montoObjetivo: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Límite</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                        value={goalForm.fechaLimite}
                                        onChange={(e) => setGoalForm({ ...goalForm, fechaLimite: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</label>
                                    <input 
                                        type="color" 
                                        className="w-full h-11 p-1 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                                        value={goalForm.color}
                                        onChange={(e) => setGoalForm({ ...goalForm, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
                            >
                                {editingGoal ? 'Guardar Cambios' : 'Crear Meta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Parametrización</h3>
                            <button onClick={() => setShowCatModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Añadir Nueva Categoría</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Nombre (ej: Mercado)"
                                        className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                        value={newCat.nombre}
                                        onChange={(e) => setNewCat({ ...newCat, nombre: e.target.value })}
                                    />
                                    <select 
                                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                                        value={newCat.tipo}
                                        onChange={(e) => setNewCat({ ...newCat, tipo: e.target.value })}
                                    >
                                        <option value="gasto">Gasto</option>
                                        <option value="ingreso">Ingreso</option>
                                    </select>
                                    <button 
                                        onClick={handleAddCategory}
                                        className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mis Categorías</h4>
                                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(c => (
                                        <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${c.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-[11px] font-black text-slate-700 uppercase">{c.nombre}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteCategory(c._id)}
                                                className="text-slate-300 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanzasPersonales;
