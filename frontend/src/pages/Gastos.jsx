import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Trash2, Filter, Search, Paperclip, ImageIcon, Edit2, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency, cleanNumericValue, getImageUrl } from '../utils/format';
import { usePermissions } from '../hooks/usePermissions';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const Gastos = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('gastos');
    
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Filtros
    const [filtros, setFiltros] = useState({
        inicio: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}-01`;
        })(),
        fin: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
    });
    const [fechaInicio, setFechaInicio] = useState(filtros.inicio);
    const [fechaFin, setFechaFin] = useState(filtros.fin);
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [mediosPago, setMediosPago] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [current, setCurrent] = useState({
        concepto: '',
        categoria_id: '',
        monto: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        notas: '',
        tipo: 'Gasto',
        medioPago: 'EFECTIVO',
        imagen: null
    });

    useEffect(() => {
        // Cargar categorias activas
        api.get('/categorias-gastos').then(res => {
            setCategorias(res.data.filter(c => c.activo));
        }).catch(() => {});

        // Cargar medios de pago
        api.get('/medios-pago').then(res => {
            setMediosPago(res.data);
        }).catch(() => {});
        
        fetchGastos();
    }, []);

    const fetchGastos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);
            if (categoriaFilter) params.append('categoria_id', categoriaFilter);

            const res = await api.get(`/gastos?${params.toString()}`);
            
            // Mapear campos del backend a lo que espera el frontend
            const mapped = res.data.map(g => ({
                id: g._id || g.id,
                concepto: g.descripcion || 'Sin descripción',
                categoria_id: g.categoria?._id || g.categoria?.id || '',
                categoria_nombre: g.categoria?.nombre || 'Sin Categoría',
                tipo: g.categoria?.tipo || 'Gasto',
                monto: parseFloat(g.monto) || 0,
                fecha_gasto: g.fecha || g.fecha_gasto,
                notas: g.observaciones || g.notas || '',
                medioPago: g.medioPago || 'EFECTIVO',
                imagen_url: g.imagen_url || g.comprobante_url || '',
                UsuarioCreacion: g.usuario?.nombre || 'Sist.'
            }));

            setGastos(mapped);
            setLoading(false);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los movimientos financieros', 'error');
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchGastos();
    };

    const handleOpenModal = (item = null) => {
        if (item && item.id) {
            setCurrent({
                id: item.id,
                concepto: item.concepto,
                categoria_id: item.categoria_id,
                monto: item.monto,
                fecha_gasto: item.fecha_gasto ? item.fecha_gasto.split('T')[0] : new Date().toISOString().split('T')[0],
                notas: item.notas || '',
                tipo: item.tipo || 'Gasto',
                medioPago: item.medioPago || 'EFECTIVO',
                imagen: null,
                imagen_url: item.imagen_url
            });
        } else {
            setCurrent({
                concepto: '',
                categoria_id: '',
                monto: '',
                fecha_gasto: new Date().toISOString().split('T')[0],
                notas: '',
                tipo: 'Gasto',
                medioPago: 'EFECTIVO',
                imagen: null
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;

        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('concepto', current.concepto);
            formData.append('categoria_id', current.categoria_id);
            formData.append('monto', current.monto);
            formData.append('fecha_gasto', current.fecha_gasto);
            formData.append('tipo', current.tipo);
            if (current.notas) formData.append('notas', current.notas);
            if (current.medioPago) formData.append('medioPago', current.medioPago);
            if (current.imagen) formData.append('imagen', current.imagen);

            if (current.id) {
                await api.put(`/gastos/${current.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/gastos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            Swal.fire('Éxito', `${current.tipo === 'Gasto' ? 'Gasto' : 'Ingreso'} ${current.id ? 'actualizado' : 'registrado'} correctamente`, 'success');
            setShowModal(false);
            fetchGastos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el movimiento', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: "No podrás recuperar este registro de dinero.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/gastos/${id}`);
                Swal.fire('Eliminado!', 'El movimiento ha sido borrado.', 'success');
                fetchGastos();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el movimiento', 'error');
            }
        }
    };

    // Filtro por texto local (ya que el rango de fechas es desde el servidor)
    const filteredGastos = gastos.filter(g => 
        (g.concepto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (g.notas?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalEgresos = filteredGastos.filter(g => g.tipo === 'Gasto').reduce((sum, g) => sum + g.monto, 0);
    const totalIngresos = filteredGastos.filter(g => g.tipo === 'Ingreso').reduce((sum, g) => sum + g.monto, 0);
    const balanceNeto = totalIngresos - totalEgresos;

    // Estadísticas por categoría (gastos)
    const CHART_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#14b8a6','#84cc16'];
    const porCategoria = Object.values(
        filteredGastos.filter(g => g.tipo === 'Gasto').reduce((acc, g) => {
            const key = g.categoria_nombre || 'Sin Categoría';
            acc[key] = acc[key] || { name: key, value: 0, count: 0 };
            acc[key].value += g.monto;
            acc[key].count += 1;
            return acc;
        }, {})
    ).sort((a, b) => b.value - a.value);

    const porMedioPago = Object.values(
        filteredGastos.reduce((acc, g) => {
            const key = g.medioPago || 'EFECTIVO';
            acc[key] = acc[key] || { name: key, gastos: 0, ingresos: 0 };
            if (g.tipo === 'Gasto') acc[key].gastos += g.monto;
            else acc[key].ingresos += g.monto;
            return acc;
        }, {})
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gastos e Ingresos</h1>
                    <p className="text-gray-500">Registra y monitorea todos los movimientos de dinero de caja</p>
                </div>
                {canEdit && (
                    <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-transform">
                        <Plus size={20} />
                        Registrar Movimiento
                    </button>
                )}
            </div>

            {/* Estadísticas */}
            {!loading && filteredGastos.length > 0 && (
                <div className="space-y-4">
                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="bg-emerald-500 text-white rounded-xl p-3"><TrendingUp size={22} /></div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Ingresos</p>
                                <p className="text-2xl font-black text-emerald-700">${formatCurrency(totalIngresos)}</p>
                                <p className="text-xs text-emerald-400">{filteredGastos.filter(g => g.tipo === 'Ingreso').length} movimientos</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="bg-red-500 text-white rounded-xl p-3"><TrendingDown size={22} /></div>
                            <div>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total Gastos</p>
                                <p className="text-2xl font-black text-red-700">${formatCurrency(totalEgresos)}</p>
                                <p className="text-xs text-red-400">{filteredGastos.filter(g => g.tipo === 'Gasto').length} movimientos</p>
                            </div>
                        </div>
                        <div className={`${balanceNeto >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-2xl p-5 flex items-center gap-4`}>
                            <div className={`${balanceNeto >= 0 ? 'bg-blue-500' : 'bg-orange-500'} text-white rounded-xl p-3`}><Scale size={22} /></div>
                            <div>
                                <p className={`text-[10px] font-black ${balanceNeto >= 0 ? 'text-blue-500' : 'text-orange-500'} uppercase tracking-widest`}>Balance Neto</p>
                                <p className={`text-2xl font-black ${balanceNeto >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>${formatCurrency(Math.abs(balanceNeto))}</p>
                                <p className={`text-xs ${balanceNeto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{balanceNeto >= 0 ? 'Superávit' : 'Déficit'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Gráficas */}
                    {porCategoria.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Dona por categoría */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Gastos por Categoría</h3>
                                <div className="flex gap-4">
                                    <ResponsiveContainer width="50%" height={180}>
                                        <PieChart>
                                            <Pie data={porCategoria} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                                                {porCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-44">
                                        {porCategoria.map((cat, i) => (
                                            <div key={i} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                    <span className="text-xs font-bold text-slate-600 truncate">{cat.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-slate-800 whitespace-nowrap">${formatCurrency(cat.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Barras por medio de pago */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Por Medio de Pago</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={porMedioPago} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(v) => `$${formatCurrency(v)}`} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4,4,0,0]} />
                                        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="card">
                <form onSubmit={handleSearch} className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                        <input 
                            type="date" 
                            className="input-field py-2" 
                            value={fechaInicio} 
                            onChange={e => setFechaInicio(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                        <input 
                            type="date" 
                            className="input-field py-2" 
                            value={fechaFin} 
                            onChange={e => setFechaFin(e.target.value)} 
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                        <select 
                            className="input-field py-2" 
                            value={categoriaFilter} 
                            onChange={e => setCategoriaFilter(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-secondary flex items-center gap-2 py-2 h-10 shadow-sm border-gray-200">
                        <Filter size={18} /> Filtrar
                    </button>
                    <div className="flex-1 min-w-[200px] flex justify-end">
                        <div className="relative w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Buscar en resultados..."
                                className="input-field pl-10 py-2 h-10 m-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>
                </form>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Categoría</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider w-1/3">Concepto/Detalle</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Auditoría</th>
                                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Monto</th>
                                {canDelete && <th className="p-4 font-semibold text-right text-xs uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-medium">Cargando registros...</td></tr>
                            ) : filteredGastos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500">
                                        No se encontraron movimientos financieros en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                filteredGastos.map(item => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                            {new Date(item.fecha_gasto).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.tipo === 'Ingreso' ? 'text-emerald-700 bg-emerald-100' : 'text-orange-700 bg-orange-100'}`}>
                                                {item.categoria_nombre || 'Sin Asignar'}
                                            </span>
                                            <div className="text-[9px] font-black mt-1 opacity-50 tracking-tighter">
                                                {item.tipo || 'Gasto'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-gray-900 leading-tight">{item.concepto}</div>
                                                {item.imagen_url && (
                                                    <a href={getImageUrl(item.imagen_url)} target="_blank" rel="noreferrer" title="Ver Factura" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded transition hover:scale-105 shadow-sm">
                                                        <ImageIcon size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            {item.notas && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.notas}</div>}
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="text-gray-600 text-[10px] uppercase font-bold tracking-wide">Por:</div>
                                            <div className="text-gray-900 font-medium">{item.UsuarioCreacion || '-'}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-lg font-black ${item.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.tipo === 'Ingreso' ? '+' : '-'}${formatCurrency(item.monto)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar Registro"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar Registro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredGastos.length > 0 && (
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                <tr className="divide-x divide-gray-100">
                                    <td colSpan="2" className="p-4 text-center">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Resumen Egresos</div>
                                        <div className="text-lg font-black text-red-600">-${formatCurrency(totalEgresos)}</div>
                                    </td>
                                    <td colSpan="2" className="p-4 text-center">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Resumen Ingresos</div>
                                        <div className="text-lg font-black text-emerald-600">+${formatCurrency(totalIngresos)}</div>
                                    </td>
                                    <td colSpan="2" className="p-4 text-right bg-blue-50/50">
                                        <div className="text-[10px] font-bold text-blue-400 uppercase">Balance de Caja</div>
                                        <div className={`text-xl font-black ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {balanceNeto >= 0 ? '+' : '-'}${formatCurrency(Math.abs(balanceNeto))}
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal Crear Gasto */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-in border border-gray-100">
                        <div className={`p-6 border-b border-gray-100 flex-shrink-0 ${current.tipo === 'Ingreso' ? 'bg-emerald-50' : 'bg-red-50'} transition-colors duration-500`}>
                            <h2 className={`text-2xl font-black ${current.tipo === 'Ingreso' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {current.tipo === 'Ingreso' ? 'Registrar Ingreso de Dinero' : 'Registrar Salida de Dinero'}
                            </h2>
                            <p className={`text-sm ${current.tipo === 'Ingreso' ? 'text-emerald-600/70' : 'text-red-600/70'} mt-1 font-medium`}>
                                {current.tipo === 'Ingreso' ? 'El monto sumará al balance positivo de la caja habitual' : 'El monto será deducido como un gasto o pago operativo'}
                            </p>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Concepto Principal *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        placeholder={current.tipo === 'Ingreso' ? "Ej. Cobro Lavandería..." : "Ej. Factura de Luz..."}
                                        value={current.concepto}
                                        onChange={e => setCurrent({...current, concepto: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Mov. *</label>
                                    <select
                                        required
                                        className={`input-field font-black ${current.tipo === 'Ingreso' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'}`}
                                        value={current.tipo}
                                        onChange={e => setCurrent({...current, tipo: e.target.value, categoria_id: ''})}
                                    >
                                        <option value="Gasto">EGRESO (-)</option>
                                        <option value="Ingreso">INGRESO (+)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                                    <select
                                        className="input-field font-medium text-gray-700"
                                        value={current.categoria_id}
                                        onChange={e => setCurrent({...current, categoria_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {categorias.filter(c => c.tipo === current.tipo).map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Movimiento *</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field text-gray-700"
                                        value={current.fecha_gasto}
                                        onChange={e => setCurrent({...current, fecha_gasto: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Monto *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        className={`input-field pl-8 font-black text-xl ${current.tipo === 'Ingreso' ? 'text-emerald-700' : 'text-red-700'}`}
                                        placeholder="0"
                                        value={formatCurrency(current.monto)}
                                        onChange={e => {
                                            const raw = cleanNumericValue(e.target.value);
                                            setCurrent({...current, monto: raw});
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas Adicionales (Opcional)</label>
                                <textarea
                                    className="input-field h-20 resize-none text-sm"
                                    placeholder="Detalles sobre este movimiento, referencias, número de factura..."
                                    value={current.notas}
                                    onChange={e => setCurrent({...current, notas: e.target.value.toUpperCase()})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Caja / Medio de Pago *</label>
                                <select
                                    required
                                    className="input-field font-medium text-gray-700"
                                    value={current.medioPago}
                                    onChange={e => setCurrent({...current, medioPago: e.target.value})}
                                >
                                    <option value="EFECTIVO">EFECTIVO (CAJA)</option>
                                    <option value="NEQUI">NEQUI</option>
                                    <option value="TRANSFERENCIA BANCOLOMBIA">Trans. Bancolombia</option>
                                    {mediosPago.filter(m => !['EFECTIVO', 'NEQUI', 'TRANSFERENCIA BANCOLOMBIA'].includes(m.nombre.toUpperCase())).map(m => (
                                        <option key={m.id} value={m.nombre.toUpperCase()}>{m.nombre.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Copia de la Factura (Opcional)</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white text-gray-600 hover:bg-gray-50 transition w-full text-sm">
                                        <Paperclip size={18} className="mr-2 text-gray-400" />
                                        {current.imagen ? current.imagen.name : 'Seleccionar Archivo (Imagen)...'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={e => setCurrent({...current, imagen: e.target.files[0]})}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-3">
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className={`flex-1 btn-primary text-white shadow-xl py-3 text-lg transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''} ${current.tipo === 'Ingreso' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
                                >
                                    {saving ? 'Procesando...' : (current.tipo === 'Ingreso' ? 'Confirmar Ingreso' : 'Confirmar Egreso')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gastos;
