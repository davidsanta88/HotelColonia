import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { ChevronLeft, ChevronRight, RefreshCw, Bed, User, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import moment from 'moment-timezone';

const CalendarioOcupacion = () => {
    const [habitaciones, setHabitaciones] = useState([]);
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mesActual, setMesActual] = useState(new Date());

    const diasDelMes = useMemo(() =>
        eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) }),
        [mesActual]
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const inicio = format(startOfMonth(mesActual), 'yyyy-MM-dd');
            const fin = format(endOfMonth(mesActual), 'yyyy-MM-dd');
            const [resHabs, resRegs] = await Promise.all([
                api.get('/habitaciones'),
                api.get(`/registros?inicio=${inicio}&fin=${fin}&limit=500`)
            ]);
            setHabitaciones(resHabs.data || []);
            const regs = Array.isArray(resRegs.data) ? resRegs.data : (resRegs.data?.registros || []);
            setRegistros(regs.filter(r => r.estado !== 'cancelado'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [mesActual]);

    const getCeldaInfo = (hab, dia) => {
        const diaStr = format(dia, 'yyyy-MM-dd');
        const reg = registros.find(r => {
            const entrada = r.fechaEntrada ? format(new Date(r.fechaEntrada), 'yyyy-MM-dd') : null;
            const salida = r.fechaSalida || r.fecha_salida;
            const salidaStr = salida ? format(new Date(salida), 'yyyy-MM-dd') : null;
            const habId = r.habitacion?._id || r.habitacion;
            return String(habId) === String(hab._id) && entrada && salidaStr && diaStr >= entrada && diaStr < salidaStr;
        });
        if (reg) {
            const entrada = format(new Date(reg.fechaEntrada), 'yyyy-MM-dd');
            const salida = reg.fechaSalida || reg.fecha_salida;
            const salidaStr = salida ? format(new Date(salida), 'yyyy-MM-dd') : null;
            const esEntrada = diaStr === entrada;
            const esSalida = salidaStr && format(new Date(salida), 'yyyy-MM-dd') === diaStr;
            return { ocupada: true, reg, esEntrada, esSalida };
        }
        return { ocupada: false };
    };

    const today = new Date();

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <RefreshCw className="animate-spin text-indigo-500" size={36} />
        </div>
    );

    return (
        <div className="space-y-4 pb-12">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Calendar size={24} /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Calendario de Ocupación</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vista mensual por habitación</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setMesActual(subMonths(mesActual, 1))} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><ChevronLeft size={18} /></button>
                    <span className="text-sm font-black text-gray-800 uppercase tracking-wide min-w-[140px] text-center">
                        {format(mesActual, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button onClick={() => setMesActual(addMonths(mesActual, 1))} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><ChevronRight size={18} /></button>
                    <button onClick={fetchData} className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all"><RefreshCw size={16} /></button>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 px-1">
                {[
                    { color: 'bg-red-400', label: 'Ocupada' },
                    { color: 'bg-emerald-400', label: 'Disponible' },
                    { color: 'bg-indigo-400', label: 'Día de entrada' },
                    { color: 'bg-orange-400', label: 'Día de salida' },
                    { color: 'bg-yellow-300 border border-yellow-400', label: 'Hoy' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
                        <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                        {l.label}
                    </div>
                ))}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
                <table className="text-[10px] w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-100 min-w-[80px]">
                                HAB
                            </th>
                            {diasDelMes.map(dia => {
                                const esHoy = isSameDay(dia, today);
                                const esFin = [0, 6].includes(dia.getDay());
                                return (
                                    <th key={dia.toISOString()} className={`px-1 py-2 font-black text-center border-b border-slate-100 min-w-[28px] ${esHoy ? 'bg-yellow-50 text-yellow-700' : esFin ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <div>{format(dia, 'd')}</div>
                                        <div className="font-normal text-[8px]">{format(dia, 'EEE', { locale: es }).slice(0, 2)}</div>
                                    </th>
                                );
                            })}
                            <th className="px-3 py-2 text-center font-black text-slate-500 uppercase tracking-widest border-b border-l border-slate-100">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {habitaciones.sort((a, b) => {
                            const na = parseInt(String(a.numero).replace(/\D/g, '')) || 0;
                            const nb = parseInt(String(b.numero).replace(/\D/g, '')) || 0;
                            return na - nb;
                        }).map(hab => {
                            const celdas = diasDelMes.map(dia => getCeldaInfo(hab, dia));
                            const ocupadas = celdas.filter(c => c.ocupada).length;
                            const pct = Math.round((ocupadas / diasDelMes.length) * 100);
                            return (
                                <tr key={hab._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-black text-slate-800 border-r border-slate-100 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Bed size={12} className="text-slate-400" />
                                            {hab.numero}
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase">{hab.tipo?.nombre || hab.tipo}</div>
                                    </td>
                                    {celdas.map((celda, idx) => {
                                        const dia = diasDelMes[idx];
                                        const esHoy = isSameDay(dia, today);
                                        let bg = esHoy ? 'bg-yellow-50' : 'bg-white';
                                        let content = null;
                                        if (celda.ocupada) {
                                            if (celda.esEntrada) bg = 'bg-indigo-400';
                                            else if (celda.esSalida) bg = 'bg-orange-400';
                                            else bg = 'bg-red-400';
                                            content = <div className="w-full h-4 rounded-sm" />;
                                        }
                                        return (
                                            <td key={idx} className={`px-0.5 py-1 text-center border-r border-slate-50 ${bg}`} title={celda.ocupada ? celda.reg?.cliente?.nombre || 'Ocupada' : 'Libre'}>
                                                {celda.ocupada ? (
                                                    <div className={`h-4 rounded-sm mx-0.5 ${celda.esEntrada ? 'bg-indigo-500' : celda.esSalida ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                ) : (
                                                    <div className="h-4" />
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-1.5 text-center font-black border-l border-slate-100">
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${pct >= 70 ? 'bg-red-100 text-red-700' : pct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {pct}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                    const totalCeldas = habitaciones.length * diasDelMes.length;
                    const ocupadas = habitaciones.reduce((acc, hab) => acc + diasDelMes.filter(d => getCeldaInfo(hab, d).ocupada).length, 0);
                    const pctGlobal = totalCeldas > 0 ? Math.round((ocupadas / totalCeldas) * 100) : 0;
                    return (
                        <>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Habitaciones</p>
                                <p className="text-2xl font-black text-gray-900">{habitaciones.length}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Días en el mes</p>
                                <p className="text-2xl font-black text-gray-900">{diasDelMes.length}</p>
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm text-center">
                                <p className="text-[9px] font-black text-red-400 uppercase mb-1">Noches ocupadas</p>
                                <p className="text-2xl font-black text-red-700">{ocupadas}</p>
                            </div>
                            <div className={`rounded-2xl p-4 border shadow-sm text-center ${pctGlobal >= 70 ? 'bg-red-50 border-red-100' : pctGlobal >= 40 ? 'bg-yellow-50 border-yellow-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ocupación del mes</p>
                                <p className={`text-2xl font-black ${pctGlobal >= 70 ? 'text-red-700' : pctGlobal >= 40 ? 'text-yellow-700' : 'text-emerald-700'}`}>{pctGlobal}%</p>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default CalendarioOcupacion;
