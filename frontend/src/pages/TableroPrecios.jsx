import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { RefreshCw, Calendar, DollarSign, Wifi, Star, Sun, Sunset } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PERSONAS = [1, 2, 3, 4, 5, 6];
const fmtCop = (v) => v && v > 0 ? `$${Number(v).toLocaleString('es-CO')}` : null;

const DIA_CONFIG = {
    entre_semana: { label: 'Entre Semana', sub: 'Lunes a Viernes', bg: 'from-indigo-600 to-indigo-700', badge: 'bg-indigo-100 text-indigo-700', icon: '📅' },
    fin_de_semana: { label: 'Fin de Semana', sub: 'Sábado y Domingo', bg: 'from-violet-600 to-purple-700', badge: 'bg-violet-100 text-violet-700', icon: '🎉' },
    festivo: { label: 'Día Festivo', sub: 'Festivos Nacionales', bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700', icon: '🎊' },
};

const TableroPrecios = () => {
    const [data, setData] = useState({ tarifas: [], tipoDia: 'entre_semana', fecha: '' });
    const [loading, setLoading] = useState(true);
    const [fechaSel, setFechaSel] = useState('');
    const [hotelConfig, setHotelConfig] = useState(null);

    const fetchData = async (fecha) => {
        setLoading(true);
        try {
            const params = fecha ? `?fecha=${fecha}` : '';
            const [resTarifas, resConfig] = await Promise.all([
                api.get(`/tarifas${params}`),
                api.get('/hotel-config')
            ]);
            setData(resTarifas.data);
            setHotelConfig(resConfig.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleFecha = (e) => {
        setFechaSel(e.target.value);
        fetchData(e.target.value);
    };

    const tipoDiaInfo = DIA_CONFIG[data.tipoDia] || DIA_CONFIG.entre_semana;
    const hoy = new Date();

    return (
        <div className="space-y-6 pb-12">
            {/* Header con tipo de día */}
            <div className={`bg-gradient-to-r ${tipoDiaInfo.bg} rounded-3xl p-6 text-white shadow-xl`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{tipoDiaInfo.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Tarifas Vigentes</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">{tipoDiaInfo.label}</h1>
                        <p className="text-sm opacity-80 font-bold mt-1">{tipoDiaInfo.sub}</p>
                        <p className="text-[11px] opacity-60 font-bold mt-1 uppercase tracking-widest">
                            {data.fecha ? format(new Date(data.fecha + 'T12:00:00'), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }) : format(hoy, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input type="date" value={fechaSel} onChange={handleFecha}
                            className="bg-white/20 border border-white/30 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none placeholder-white/60"
                            title="Consultar precios para otra fecha" />
                        <button onClick={() => { setFechaSel(''); fetchData(); }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-indigo-400" size={36} /></div>
            ) : data.tarifas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                    <DollarSign size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-black text-xs uppercase">No hay tarifas configuradas</p>
                    <p className="text-slate-300 text-xs mt-1">El administrador debe crear las tarifas en Configuraciones → Tarifas</p>
                </div>
            ) : (
                <>
                    {/* Tarjetas de precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.tarifas.map(t => {
                            const precios = t[data.tipoDia] || {};
                            const preciosValidos = PERSONAS.filter(p => precios[`personas_${p}`] > 0);
                            return (
                                <div key={t._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    <div className="h-2" style={{ backgroundColor: t.color || '#4f46e5' }} />
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-slate-800">{t.nombre}</h3>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${tipoDiaInfo.badge}`}>
                                                {tipoDiaInfo.label}
                                            </span>
                                        </div>

                                        {preciosValidos.length === 0 ? (
                                            <p className="text-slate-300 text-xs font-bold text-center py-4">Sin precio configurado</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {preciosValidos.map(p => (
                                                    <div key={p} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">{'👤'.repeat(Math.min(p, 3))}{p > 3 ? `+${p-3}` : ''}</span>
                                                            <span className="text-xs font-bold text-slate-500">
                                                                {p === 1 ? '1 persona' : `${p} personas`}
                                                            </span>
                                                        </div>
                                                        <span className="text-lg font-black text-slate-900" style={{ color: t.color || '#4f46e5' }}>
                                                            {fmtCop(precios[`personas_${p}`])}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {t.notas && (
                                            <p className="mt-3 text-[10px] text-slate-400 font-bold italic border-t border-slate-50 pt-3">
                                                ℹ️ {t.notas}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tabla comparativa entre todos los días */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide">Comparativa de Precios por Tipo de Día</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Habitación</th>
                                        <th className="text-center px-3 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Personas</th>
                                        <th className="text-right px-3 py-3 font-black text-indigo-600 uppercase tracking-widest text-[9px]">📅 Entre Semana</th>
                                        <th className="text-right px-3 py-3 font-black text-violet-600 uppercase tracking-widest text-[9px]">🎉 Fin de Semana</th>
                                        <th className="text-right px-4 py-3 font-black text-amber-600 uppercase tracking-widest text-[9px]">🎊 Festivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.tarifas.map(t =>
                                        PERSONAS.filter(p =>
                                            (t.entre_semana?.[`personas_${p}`] > 0) ||
                                            (t.fin_de_semana?.[`personas_${p}`] > 0) ||
                                            (t.festivo?.[`personas_${p}`] > 0)
                                        ).map((p, idx) => (
                                            <tr key={`${t._id}-${p}`} className={`border-b border-slate-50 ${data.tipoDia === 'entre_semana' ? '' : data.tipoDia === 'fin_de_semana' ? '' : ''} hover:bg-slate-50/50 transition-colors`}>
                                                {idx === 0 && (
                                                    <td className="px-4 py-2.5 font-black text-slate-800" rowSpan={PERSONAS.filter(pp => (t.entre_semana?.[`personas_${pp}`] > 0) || (t.fin_de_semana?.[`personas_${pp}`] > 0) || (t.festivo?.[`personas_${pp}`] > 0)).length}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                                            {t.nombre}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-3 py-2.5 text-center text-slate-500 font-bold">{p === 1 ? '1 persona' : `${p} personas`}</td>
                                                <td className={`px-3 py-2.5 text-right font-black ${data.tipoDia === 'entre_semana' ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600'}`}>
                                                    {fmtCop(t.entre_semana?.[`personas_${p}`]) || '–'}
                                                </td>
                                                <td className={`px-3 py-2.5 text-right font-black ${data.tipoDia === 'fin_de_semana' ? 'text-violet-700 bg-violet-50' : 'text-slate-600'}`}>
                                                    {fmtCop(t.fin_de_semana?.[`personas_${p}`]) || '–'}
                                                </td>
                                                <td className={`px-4 py-2.5 text-right font-black ${data.tipoDia === 'festivo' ? 'text-amber-700 bg-amber-50' : 'text-slate-600'}`}>
                                                    {fmtCop(t.festivo?.[`personas_${p}`]) || '–'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WiFi si está configurado */}
                    {hotelConfig?.wifiNombre && (
                        <div className="bg-slate-800 rounded-2xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Wifi size={18} />
                                <h3 className="font-black text-sm uppercase tracking-wide">Acceso WiFi</h3>
                            </div>
                            <p className="text-slate-300 text-xs font-bold mb-3">Red: <span className="text-white">{hotelConfig.wifiNombre}</span></p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[1,2,3,4].filter(p => hotelConfig[`wifiClave${p}`]).map(p => (
                                    <div key={p} className="bg-white/10 rounded-xl p-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Piso {p}</p>
                                        <p className="text-sm font-black text-white">{hotelConfig[`wifiClave${p}`]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TableroPrecios;
