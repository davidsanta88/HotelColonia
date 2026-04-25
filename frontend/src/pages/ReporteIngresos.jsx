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
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReporteIngresos = () => {
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        inicio: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        fin: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    useEffect(() => {
        fetchIngresos();
    }, []);

    const fetchIngresos = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reportes/detalle-ingresos?inicio=${filtros.inicio}&fin=${filtros.fin}`);
            setIngresos(res.data);
            setCurrentPage(1);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los ingresos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchIngresos();
    };

    const filteredIngresos = useMemo(() => {
        return ingresos.filter(i => {
            const searchLower = searchTerm.toLowerCase();
            return (
                i.descripcion.toLowerCase().includes(searchLower) ||
                i.tipo.toLowerCase().includes(searchLower) ||
                i.usuario.toLowerCase().includes(searchLower) ||
                i.medioPago.toLowerCase().includes(searchLower)
            );
        });
    }, [ingresos, searchTerm]);

    const paginatedIngresos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredIngresos.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredIngresos, currentPage, itemsPerPage]);

    const totalIngresos = useMemo(() => {
        return filteredIngresos.reduce((sum, i) => sum + i.monto, 0);
    }, [filteredIngresos]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleExportExcel = () => {
        const dataToExport = filteredIngresos.map(i => ({
            'Fecha y Hora': format(new Date(i.fecha), 'dd/MM/yyyy HH:mm'),
            'Tipo': i.tipo,
            'Descripción': i.descripcion,
            'Usuario': i.usuario,
            'Medio de Pago': i.medioPago,
            'Valor': i.monto
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Reporte_Ingresos_${filtros.inicio}_a_${filtros.fin}.xlsx`);
    };

    const totalPages = Math.ceil(filteredIngresos.length / itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        Reporte Detallado de Ingresos
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Registro cronológico de todo el dinero recibido en el hotel</p>
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

            {/* Filters & Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
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

                <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-200 text-white flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 relative z-10">Total Recaudado</p>
                    <p className="text-3xl font-black relative z-10">{formatCurrency(totalIngresos)}</p>
                    <p className="text-[10px] font-bold mt-1 opacity-70 relative z-10">{filteredIngresos.length} movimientos encontrados</p>
                </div>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por descripción, tipo o usuario..."
                            className="input-field pl-10 py-2 w-full text-sm"
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
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Movimiento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción / Detalle</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Medio de Pago</th>
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
                            ) : paginatedIngresos.length > 0 ? (
                                paginatedIngresos.map((ingreso, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{format(new Date(ingreso.fecha), 'dd/MM/yyyy')}</span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} /> {format(new Date(ingreso.fecha), 'HH:mm')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                ingreso.tipo === 'HOSPEDAJE' ? 'bg-blue-50 text-blue-600' :
                                                ingreso.tipo === 'VENTA' ? 'bg-purple-50 text-purple-600' :
                                                ingreso.tipo === 'RESERVA' ? 'bg-amber-50 text-amber-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {ingreso.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-600 line-clamp-1">{ingreso.descripcion}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{ingreso.usuario}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{ingreso.medioPago}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-black text-emerald-600">
                                                +{formatCurrency(ingreso.monto)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search size={48} />
                                            <p className="text-lg font-black uppercase tracking-widest">No se encontraron ingresos</p>
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
