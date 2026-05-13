import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Clock, Plus, Edit, Trash2, RefreshCw, X, Save, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TURNOS = [
    { key: 'Mañana',   color: 'bg-amber-100 text-amber-800 border-amber-200',    dot: 'bg-amber-400' },
    { key: 'Tarde',    color: 'bg-blue-100 text-blue-800 border-blue-200',        dot: 'bg-blue-400' },
    { key: 'Noche',    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',  dot: 'bg-indigo-500' },
    { key: 'Completo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    { key: 'Descanso', color: 'bg-slate-100 text-slate-500 border-slate-200',     dot: 'bg-slate-300' },
];

const turnoStyle = (key) => TURNOS.find(t => t.key === key) || TURNOS[0];

const hoy = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = () => ({ usuario: '', fecha: hoy(), turno: 'Mañana', horaInicio: '', horaFin: '', notas: '' });

const Turnos = () => {
    const [turnos, setTurnos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [semanaBase, setSemanaBase] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [vistaTabla, setVistaTabla] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [filtroUsuario, setFiltroUsuario] = useState('');

    const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i));
    const inicio = format(semanaBase, 'yyyy-MM-dd');
    const fin = format(addDays(semanaBase, 6), 'yyyy-MM-dd');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, uRes] = await Promise.all([
                api.get(`/turnos?inicio=${inicio}&fin=${fin}`),
                api.get('/usuarios')
            ]);
            setTurnos(tRes.data);
            setUsuarios(uRes.data.filter(u => u.activo !== false));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [inicio]);

    const abrirNuevo = (fecha = hoy(), usuario = '') => {
        setForm({ ...emptyForm(), fecha, usuario });
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (t) => {
        setForm({
            usuario: t.usuario?._id || t.usuario,
            fecha: format(new Date(t.fecha), 'yyyy-MM-dd'),
            turno: t.turno,
            horaInicio: t.horaInicio || '',
            horaFin: t.horaFin || '',
            notas: t.notas || ''
        });
        setEditando(t._id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.usuario || !form.fecha || !form.turno)
            return Swal.fire('Campos requeridos', 'Empleada, fecha y turno son obligatorios', 'warning');
        try {
            if (editando) await api.put(`/turnos/${editando}`, form);
            else await api.post('/turnos', form);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Guardado', showConfirmButton: false, timer: 1500 });
            setShowModal(false);
            fetchData();
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar', 'error');
        }
    };

    const handleEliminar = async (id) => {
        const r = await Swal.fire({ title: '¿Eliminar turno?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
        if (!r.isConfirmed) return;
        await api.delete(`/turnos/${id}`);
        fetchData();
    };

    const turnosDia = (dia, usuarioId) => turnos.filter(t => {
        const fTurno = format(new Date(t.fecha), 'yyyy-MM-dd');
        const matchDia = fTurno === format(dia, 'yyyy-MM-dd');
        const matchUser = usuarioId ? (t.usuario?._id === usuarioId || t.usuario === usuarioId) : true;
        return matchDia && matchUser;
    });

    const usuariosFiltrados = filtroUsuario
        ? usuarios.filter(u => u._id === filtroUsuario)
        : usuarios;

    return (
        <div className="space-y-5 pb-12">
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Clock size={22} /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Turnos del Personal</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Control de horarios</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => abrirNuevo()} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all">
                        <Plus size={16} /> Registrar Turno
                    </button>
                    <button onClick={() => setVistaTabla(v => !v)} className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-black hover:bg-slate-200 transition-all">
                        {vistaTabla ? 'Vista Semana' : 'Vista Lista'}
                    </button>
                    <button onClick={fetchData} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filtro empleada */}
            <div className="flex items-center gap-3">
                <Users size={16} className="text-slate-400" />
                <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                    <option value="">Todas las empleadas</option>
                    {usuarios.map(u => <option key={u._id} value={u._id}>{u.nombre}</option>)}
                </select>
            </div>

            {/* Navegación semana */}
            <div className="flex items-center gap-3">
                <button onClick={() => setSemanaBase(s => subWeeks(s, 1))} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
                <span className="text-sm font-black text-slate-700">
                    {format(semanaBase, "d 'de' MMMM", { locale: es })} — {format(addDays(semanaBase, 6), "d 'de' MMMM yyyy", { locale: es })}
                </span>
                <button onClick={() => setSemanaBase(s => addWeeks(s, 1))} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
                <button onClick={() => setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    className="px-3 py-1.5 text-xs font-black bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-all">Hoy</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-violet-400" size={32} /></div>
            ) : vistaTabla ? (
                /* Vista lista */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Empleada</th>
                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Fecha</th>
                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Turno</th>
                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Horario</th>
                                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Notas</th>
                                    <th className="text-right px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turnos.filter(t => !filtroUsuario || t.usuario?._id === filtroUsuario).length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-bold text-xs">No hay turnos registrados esta semana</td></tr>
                                ) : turnos.filter(t => !filtroUsuario || t.usuario?._id === filtroUsuario).map(t => {
                                    const st = turnoStyle(t.turno);
                                    return (
                                        <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-black text-slate-800">{t.usuario?.nombre || '–'}</td>
                                            <td className="px-4 py-3 text-slate-600 font-bold">{format(new Date(t.fecha), "EEE d MMM", { locale: es })}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${st.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                    {t.turno}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-bold">
                                                {t.horaInicio && t.horaFin ? `${t.horaInicio} – ${t.horaFin}` : t.horaInicio || '–'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 italic max-w-[150px] truncate">{t.notas || ''}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => abrirEditar(t)} className="p-1.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg mr-1 transition-all"><Edit size={13} /></button>
                                                <button onClick={() => handleEliminar(t._id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all"><Trash2 size={13} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Vista semana por empleada */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-100 w-32">Empleada</th>
                                    {diasSemana.map(dia => {
                                        const esHoy = format(dia, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                        return (
                                            <th key={dia} className={`px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest border-b border-slate-100 min-w-[110px] ${esHoy ? 'text-violet-600 bg-violet-50' : 'text-slate-500'}`}>
                                                <div>{format(dia, 'EEE', { locale: es })}</div>
                                                <div className={`text-base font-black mt-0.5 ${esHoy ? 'text-violet-700' : 'text-slate-700'}`}>{format(dia, 'd')}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-bold">No hay empleadas registradas</td></tr>
                                ) : usuariosFiltrados.map(u => (
                                    <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="sticky left-0 bg-white px-4 py-3 font-black text-slate-800 border-r border-slate-100 text-xs">
                                            {u.nombre.split(' ')[0]}
                                        </td>
                                        {diasSemana.map(dia => {
                                            const ts = turnosDia(dia, u._id);
                                            const esHoy = format(dia, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                            return (
                                                <td key={dia} className={`px-2 py-2 text-center align-top border-r border-slate-50 ${esHoy ? 'bg-violet-50/40' : ''}`}>
                                                    <div className="space-y-1">
                                                        {ts.map(t => {
                                                            const st = turnoStyle(t.turno);
                                                            return (
                                                                <div key={t._id} className={`group relative flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer ${st.color}`}
                                                                    onClick={() => abrirEditar(t)}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                                                                    <span className="truncate">{t.turno}</span>
                                                                    <button className="hidden group-hover:flex ml-auto p-0.5 hover:text-red-500"
                                                                        onClick={e => { e.stopPropagation(); handleEliminar(t._id); }}>
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        <button onClick={() => abrirNuevo(format(dia, 'yyyy-MM-dd'), u._id)}
                                                            className="w-full flex items-center justify-center py-1 text-slate-300 hover:text-violet-500 hover:bg-violet-50 rounded-lg border border-dashed border-transparent hover:border-violet-200 transition-all">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-800">{editando ? 'Editar Turno' : 'Registrar Turno'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg"><X size={16} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Empleada *</label>
                                <select value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400">
                                    <option value="">Seleccionar empleada...</option>
                                    {usuarios.map(u => <option key={u._id} value={u._id}>{u.nombre}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Fecha *</label>
                                    <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Turno *</label>
                                    <select value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400">
                                        {TURNOS.map(t => <option key={t.key} value={t.key}>{t.key}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Hora inicio</label>
                                    <input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Hora fin</label>
                                    <input type="time" value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Notas (opcional)</label>
                                <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="Observaciones del turno..."
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-black uppercase hover:bg-violet-700 transition-all">
                                <Save size={14} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Turnos;
