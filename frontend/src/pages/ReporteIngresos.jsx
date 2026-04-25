import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    TrendingUp, 
    Calendar, 
    Filter, 
    Download, 
    Search,
    User,
    Tag,
    DollarSign,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileText,
    TrendingDown,
    Activity
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReporteIngresos = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        fin: format(new Date(), 'yyyy-MM-dd')
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    useEffect(() => {
        fetchMovimientos();
    }, []);

    const fetchMovimientos = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reportes/detalle-ingresos?inicio=${filtros.inicio}&fin=${filtros.fin}`);
            setMovimientos(res.data);
            setCurrentPage(1);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los movimientos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchMovimientos();
    };

    const filteredMovimientos = useMemo(() => {
        return movimientos.filter(i => {
            const searchLower = searchTerm.toLowerCase();
            return (
                i.descripcion.toLowerCase().includes(searchLower) ||
                i.tipo.toLowerCase().includes(searchLower) ||
                i.usuario.toLowerCase().includes(searchLower) ||
                i.medioPago.toLowerCase().includes(searchLower)
            );
        });
    }, [movimientos, searchTerm]);

    const paginatedMovimientos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMovimientos.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMovimientos, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        const ingresos = filteredMovimientos.filter(m => m.monto > 0).reduce((sum, m) => sum + m.monto, 0);
        const egresos = Math.abs(filteredMovimientos.filter(m => m.monto < 0).reduce((sum, m) => sum + m.monto, 0));
        const balance = ingresos - egresos;
        return { ingresos, egresos, balance };
    }, [filteredMovimientos]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleExportExcel = () => {
        const dataToExport = filteredMovimientos.map(i => ({
            'Fecha y Hora': format(new Date(i.fecha), 'dd/MM/yyyy HH:mm'),
            'Tipo': i.tipo,
            'Descripción': i.descripcion,
            'Usuario': i.usuario,
            'Medio de Pago': i.medioPago,
            'Valor': i.monto
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Reporte_Movimientos_${filtros.inicio}_a_${filtros.fin}.xlsx`);
    };

    const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        Reporte Detallado de Caja
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Ingresos y Egresos por Periodo</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportExcel}
                        className="btn-secondary flex items-center gap-2 text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    >
                        <Download size={18} /> Exportar Excel
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Ingresos</p>
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(stats.ingresos)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Egresos</p>
                        <p className="text-xl font-black text-rose-700">{formatCurrency(stats.egresos)}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4 group">
                    <div className="p-4 bg-white/10 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Neto</p>
                        <p className="text-xl font-black text-white">{formatCurrency(stats.balance)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="date" 
                                className="input-field pl-10 py-2 h-11 w-full" 
                                value={filtros.inicio}
                                onChange={e => setFiltros({...filtros, inicio: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-widest">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="date" 
                                className="input-field pl-10 py-2 h-11 w-full" 
                                value={filtros.fin}
                                onChange={e => setFiltros({...filtros, fin: e.target.value})}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary flex items-center gap-2 h-11 px-8 font-bold shadow-lg shadow-primary-500/20">
                        <Filter size={18} /> Filtrar
                    </button>
                </form>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por descripción, tipo o usuario..."
                            className="input-field pl-10 py-2 w-full text-sm font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Página {currentPage} de {totalPages || 1}</span>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción / Detalle</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Medio</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedMovimientos.length > 0 ? (
                                paginatedMovimientos.map((mov, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{format(new Date(mov.fecha), 'dd/MM/yyyy')}</span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} /> {format(new Date(mov.fecha), 'HH:mm')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                mov.tipo === 'GASTO' ? 'bg-rose-50 text-rose-600' :
                                                mov.tipo === 'HOSPEDAJE' ? 'bg-blue-50 text-blue-600' :
                                                mov.tipo === 'VENTA' ? 'bg-purple-50 text-purple-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-600 line-clamp-1">{mov.descripcion}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={10} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{mov.usuario}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{mov.medioPago}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`text-sm font-black ${mov.monto > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {mov.monto > 0 ? '+' : ''}{formatCurrency(mov.monto)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search size={48} />
                                            <p className="text-lg font-black uppercase tracking-widest">No se encontraron movimientos</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReporteIngresos;
