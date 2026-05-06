import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Tag, Plus, Edit, Trash2, Save, X, RefreshCw, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';

const DIAS = [
    { key: 'entre_semana', label: 'Entre Semana', sub: 'Lunes — Viernes', color: 'indigo' },
    { key: 'fin_de_semana', label: 'Fin de Semana', sub: 'Sábado — Domingo', color: 'violet' },
    { key: 'festivo', label: 'Festivos', sub: 'Días festivos', color: 'amber' },
];

const PERSONAS = [1, 2, 3, 4, 5, 6];

const COLORES = ['#4f46e5','#7c3aed','#db2777','#dc2626','#16a34a','#ca8a04','#0891b2','#374151'];

const emptyPrecios = () => ({ personas_1: 0, personas_2: 0, personas_3: 0, personas_4: 0, personas_5: 0, personas_6: 0 });
const emptyForm = () => ({
    nombre: '', color: '#4f46e5', notas: '',
    entre_semana: emptyPrecios(),
    fin_de_semana: emptyPrecios(),
    festivo: emptyPrecios(),
});

const fmtCop = (v) => v ? `$${Number(v).toLocaleString('es-CO')}` : '–';

const Tarifas = () => {
    const [tarifas, setTarifas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(null); // null | 'new' | id
    const [form, setForm] = useState(emptyForm());

    const fetchTarifas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tarifas/admin');
            setTarifas(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTarifas(); }, []);

    const handleNueva = () => { setForm(emptyForm()); setEditando('new'); };
    const handleEditar = (t) => { setForm({ ...t }); setEditando(t._id); };
    const handleCancelar = () => { setEditando(null); setForm(emptyForm()); };

    const handleChangePrecio = (tipoDia, persona, valor) => {
        setForm(f => ({ ...f, [tipoDia]: { ...f[tipoDia], [`personas_${persona}`]: Number(valor) || 0 } }));
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) return Swal.fire('Campo requerido', 'El nombre de la tarifa es obligatorio', 'warning');
        try {
            if (editando === 'new') await api.post('/tarifas', form);
            else await api.put(`/tarifas/${editando}`, form);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Guardado', showConfirmButton: false, timer: 1500 });
            fetchTarifas();
            handleCancelar();
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar', 'error');
        }
    };

    const handleEliminar = async (id) => {
        const r = await Swal.fire({ title: '¿Eliminar tarifa?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
        if (!r.isConfirmed) return;
        await api.delete(`/tarifas/${id}`);
        fetchTarifas();
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Tag size={22} /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Tarifas de Habitaciones</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Precios por tipo de día</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleNueva} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                        <Plus size={16} /> Nueva Tarifa
                    </button>
                    <button onClick={fetchTarifas} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Formulario */}
            {editando && (
                <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-slate-800">{editando === 'new' ? 'Nueva Tarifa' : 'Editar Tarifa'}</h2>
                        <button onClick={handleCancelar} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"><X size={16} /></button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Nombre del tipo de habitación *</label>
                            <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                placeholder="Ej: Sencilla, Doble, Suite, Familiar..."
                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORES.map(c => (
                                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Precios por tipo de día */}
                    {DIAS.map(dia => (
                        <div key={dia.key} className={`border border-${dia.color}-200 bg-${dia.color}-50 rounded-2xl p-4`}>
                            <div className="mb-3">
                                <p className={`text-sm font-black text-${dia.color}-700 uppercase`}>{dia.label}</p>
                                <p className={`text-[10px] text-${dia.color}-500 font-bold`}>{dia.sub}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {PERSONAS.map(p => (
                                    <div key={p}>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">{p === 1 ? '1 persona' : `${p} personas`}</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                            <input type="number" value={form[dia.key][`personas_${p}`] || ''}
                                                onChange={e => handleChangePrecio(dia.key, p, e.target.value)}
                                                placeholder="0"
                                                className="w-full pl-5 pr-2 py-2 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Notas (opcional)</label>
                        <input type="text" value={form.notas || ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                            placeholder="Ej: Precio incluye desayuno, máx 2 adultos..."
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button onClick={handleCancelar} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all">
                            <Save size={14} /> Guardar Tarifa
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de tarifas */}
            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-indigo-400" size={32} /></div>
            ) : tarifas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                    <Tag size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-black text-xs uppercase">No hay tarifas configuradas</p>
                    <button onClick={handleNueva} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all">
                        <Plus size={14} className="inline mr-1" /> Crear primera tarifa
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {tarifas.map(t => (
                        <div key={t._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color || '#4f46e5' }} />
                                    <h3 className="font-black text-slate-800 text-sm">{t.nombre}</h3>
                                    {t.notas && <span className="text-[10px] text-slate-400 font-bold italic">{t.notas}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditar(t)} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"><Edit size={14} /></button>
                                    <button onClick={() => handleEliminar(t._id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="text-left px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">Tipo día</th>
                                            {PERSONAS.map(p => (
                                                <th key={p} className="text-right px-3 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">{p}p</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DIAS.map(dia => (
                                            <tr key={dia.key} className="border-t border-slate-50">
                                                <td className="px-4 py-2.5 font-black text-slate-700">{dia.label}</td>
                                                {PERSONAS.map(p => (
                                                    <td key={p} className="px-3 py-2.5 text-right font-bold text-slate-600">
                                                        {t[dia.key]?.[`personas_${p}`] > 0 ? fmtCop(t[dia.key][`personas_${p}`]) : <span className="text-slate-200">–</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tarifas;
