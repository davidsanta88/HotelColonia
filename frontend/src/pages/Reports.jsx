import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { BarChart3, TrendingUp, Package, Users, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';

const Reports = () => {
    const [resumen, setResumen] = useState(null);
    const [ventasData, setVentasData] = useState([]);
    const [productosTop, setProductosTop] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({
        inicio: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        fin: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [resResumen, resVentas, resTop] = await Promise.all([
                api.get('/reportes/resumen'),
                api.get(`/reportes/ventas?inicio=${dates.inicio}&fin=${dates.fin}`),
                api.get('/reportes/productos-mas-vendidos')
            ]);
            setResumen(resResumen.data);
            setVentasData(resVentas.data);
            setProductosTop(resTop.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los reportes', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !resumen) return <div className="p-10 text-center text-gray-400">Generando reportes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Análisis y Reportes</h1>
                    <p className="text-gray-500">Resumen del rendimiento del hotel y la tienda</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <Calendar size={18} className="text-gray-400 ml-1" />
                    <input type="date" className="bg-transparent border-none text-sm focus:ring-0" value={dates.inicio} onChange={e => setDates({...dates, inicio: e.target.value})} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="bg-transparent border-none text-sm focus:ring-0" value={dates.fin} onChange={e => setDates({...dates, fin: e.target.value})} />
                    <button onClick={fetchReports} className="btn-primary py-1.5 px-3 text-xs ml-2">Actualizar</button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Ventas Hoy</p>
                        <h3 className="text-xl font-black text-gray-900">${formatCurrency(resumen?.ventas_hoy) || '0'}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Hab. Ocupadas</p>
                        <h3 className="text-xl font-black text-gray-900">{resumen?.hab_ocupadas}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Alertas Stock</p>
                        <h3 className="text-xl font-black text-gray-900">{resumen?.alertas_stock}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Ventas Período</p>
                        <h3 className="text-xl font-black text-gray-900">
                            ${formatCurrency(ventasData.reduce((acc, v) => acc + v.gran_total, 0))}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Table */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-primary-600" /> Historial de Ventas Diarias
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Ventas</th>
                                    <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Total Recaudado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ventasData.map((v, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-sm text-gray-600">{new Date(v.fecha).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm text-center text-gray-600">{v.num_ventas}</td>
                                        <td className="px-4 py-2 text-sm text-right font-bold text-gray-900">${formatCurrency(v.gran_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-orange-500" /> Productos más Vendidos (Tienda/Hab)
                    </h3>
                    <div className="space-y-4">
                        {productosTop.map((p, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{p.nombre}</p>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1">
                                        <div 
                                            className="bg-primary-500 h-1.5 rounded-full" 
                                            style={{ width: `${(p.total_vendido / productosTop[0].total_vendido) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-gray-900">{p.total_vendido} uds</p>
                                    <p className="text-[10px] text-gray-400">${formatCurrency(p.total_recaudado)}</p>
                                </div>
                            </div>
                        ))}
                        {productosTop.length === 0 && (
                            <div className="text-center py-10 text-gray-400 italic">No hay datos de ventas registrados</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
