import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Star, CheckCircle, Clock, Trash2, Link, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/format';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Stars = ({ value }) => (
    <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
            <Star key={n} size={12} className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
        ))}
    </div>
);

const EncuestasAdmin = () => {
    const [data, setData] = useState({ encuestas: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todas');
    const { supported, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/encuestas');
            setData(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleGenerar = async () => {
        const { value } = await Swal.fire({
            title: 'Generar Encuesta',
            html: `
                <input id="hab" class="swal2-input" placeholder="Número de habitación" />
                <input id="huesped" class="swal2-input" placeholder="Nombre del huésped" />
            `,
            confirmButtonText: 'Generar enlace',
            showCancelButton: true,
            preConfirm: () => ({
                habitacion_numero: document.getElementById('hab').value,
                huesped_nombre: document.getElementById('huesped').value,
                hotel: document.title || 'Hotel'
            })
        });
        if (!value) return;
        try {
            const res = await api.post('/encuestas', value);
            Swal.fire({
                title: 'Enlace generado',
                html: `<p class="text-sm mb-2">Comparte este enlace con el huésped:</p><input class="swal2-input text-xs" value="${res.data.url}" readonly onclick="this.select()" />`,
                icon: 'success'
            });
            fetchData();
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'No se pudo crear', 'error');
        }
    };

    const handleDelete = async (id) => {
        const r = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
        if (!r.isConfirmed) return;
        await api.delete(`/encuestas/${id}`);
        fetchData();
    };

    const copyLink = (token) => {
        const url = `${window.location.origin}/encuesta/${token}`;
        navigator.clipboard.writeText(url);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Enlace copiado', showConfirmButton: false, timer: 1500 });
    };

    const encuestasFiltradas = data.encuestas.filter(e =>
        filtro === 'todas' || (filtro === 'completadas' ? e.completada : !e.completada)
    );

    const s = data.stats || {};

    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl"><Star size={22} /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Encuestas de Satisfacción</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Opiniones de huéspedes</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {supported && (
                        <button onClick={subscribed ? unsubscribe : subscribe} disabled={pushLoading}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subscribed ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                            {pushLoading ? '...' : subscribed ? '🔕 Desactivar notif.' : '🔔 Activar notif.'}
                        </button>
                    )}
                    <button onClick={handleGenerar} className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-600 transition-all">
                        + Generar Encuesta
                    </button>
                    <button onClick={fetchData} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total', val: s.total || 0, color: 'bg-slate-50' },
                    { label: 'Completadas', val: s.completadas || 0, color: 'bg-emerald-50' },
                    { label: 'Pendientes', val: s.pendientes || 0, color: 'bg-yellow-50' },
                    { label: 'General ★', val: s.calificacion_general || '–', color: 'bg-yellow-50' },
                    { label: 'Limpieza ★', val: s.calificacion_limpieza || '–', color: 'bg-yellow-50' },
                    { label: 'Recomiendan', val: s.recomendarian || 0, color: 'bg-indigo-50' },
                ].map(item => (
                    <div key={item.label} className={`${item.color} rounded-2xl p-4 border border-gray-100 text-center`}>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{item.label}</p>
                        <p className="text-xl font-black text-gray-800">{item.val}</p>
                    </div>
                ))}
            </div>

            {/* Filtro */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
                {['todas', 'completadas', 'pendientes'].map(f => (
                    <button key={f} onClick={() => setFiltro(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Huésped</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Hab.</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Estado</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">General</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Limpieza</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Atención</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Instalac.</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Recom.</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Comentario</th>
                            <th className="text-left px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Fecha</th>
                            <th className="px-3 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {encuestasFiltradas.map(e => (
                            <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-700">{e.huesped_nombre || '–'}</td>
                                <td className="px-3 py-3 font-black text-slate-800">{e.habitacion_numero || '–'}</td>
                                <td className="px-3 py-3">
                                    {e.completada
                                        ? <span className="flex items-center gap-1 text-emerald-600 font-black"><CheckCircle size={12} /> Completada</span>
                                        : <span className="flex items-center gap-1 text-amber-500 font-black"><Clock size={12} /> Pendiente</span>}
                                </td>
                                <td className="px-3 py-3">{e.completada ? <Stars value={e.calificacion_general} /> : '–'}</td>
                                <td className="px-3 py-3">{e.completada ? <Stars value={e.calificacion_limpieza} /> : '–'}</td>
                                <td className="px-3 py-3">{e.completada ? <Stars value={e.calificacion_atencion} /> : '–'}</td>
                                <td className="px-3 py-3">{e.completada ? <Stars value={e.calificacion_instalaciones} /> : '–'}</td>
                                <td className="px-3 py-3">
                                    {e.completada ? (e.recomendaria ? <ThumbsUp size={14} className="text-emerald-500" /> : <ThumbsDown size={14} className="text-red-500" />) : '–'}
                                </td>
                                <td className="px-3 py-3 max-w-[180px] truncate text-slate-600">{e.comentario || '–'}</td>
                                <td className="px-3 py-3 text-slate-400 whitespace-nowrap">
                                    {e.completada ? new Date(e.fecha_completada).toLocaleDateString('es-CO') : new Date(e.createdAt).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex gap-1">
                                        {!e.completada && (
                                            <button onClick={() => copyLink(e.token)} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all" title="Copiar enlace">
                                                <Link size={12} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(e._id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {encuestasFiltradas.length === 0 && (
                            <tr><td colSpan={11} className="text-center py-12 text-slate-300 font-black text-xs uppercase">Sin encuestas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EncuestasAdmin;
