import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import moment from 'moment';
import 'moment/locale/es';
import { Calendar as CalendarIcon, List, Search, AlertCircle, Eye, Printer, RefreshCw, Hotel, Building2, Calendar, User, MessageSquare, FileSpreadsheet, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/format';
import Pagination from '../components/common/Pagination';
import { generateVoucher } from '../utils/voucherGenerator';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

moment.locale('es');

const ReservasConsolidadas = () => {
    const { user } = useContext(AuthContext);
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hotelFilter, setHotelFilter] = useState('all'); // 'all', 'plaza', 'colonial'
    const [fechaInicio, setFechaInicio] = useState(moment().format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState(moment().add(3, 'months').format('YYYY-MM-DD'));
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchConsolidated();
    }, [fechaInicio, fechaFin]);

    const fetchConsolidated = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/stats/consolidated-reservations?inicio=${fechaInicio}&fin=${fechaFin}`);
            setReservas(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching consolidated reservations:', error);
            Swal.fire('Error', 'No se pudieron cargar las reservaciones consolidadas', 'error');
            setLoading(false);
        }
    };

    const filteredReservas = useMemo(() => {
        return reservas.filter(r => {
            // Search term
            const searchLower = searchTerm.toLowerCase();
            const cliente = (r.cliente_nombre || '').toLowerCase();
            const doc = (r.documento || '').toLowerCase();
            const matchesSearch = searchTerm === '' || cliente.includes(searchLower) || doc.includes(searchLower);

            // Hotel filter
            const matchesHotel = hotelFilter === 'all' || r.hotel_id === hotelFilter;

            return matchesSearch && matchesHotel;
        });
    }, [reservas, searchTerm, hotelFilter]);

    const paginatedReservas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReservas.slice(start, start + itemsPerPage);
    }, [filteredReservas, currentPage, itemsPerPage]);

    // Funciones de Exportación
    const handleExportExcel = () => {
        const dataToExport = filteredReservas.map(r => ({
            'Hotel': r.hotel,
            'Cliente': r.cliente_nombre?.toUpperCase(),
            'Identificación': r.documento,
            'Habitaciones': r.habitaciones_desc,
            'Entrada': moment.utc(r.fecha_entrada).format('DD/MM/YYYY'),
            'Salida': moment.utc(r.fecha_salida).format('DD/MM/YYYY'),
            'Noches': moment.utc(r.fecha_salida).diff(moment.utc(r.fecha_entrada), 'days'),
            'Valor Total': r.valor_total,
            'Valor Abonado': r.valor_abonado,
            'Saldo': (r.valor_total || 0) - (r.valor_abonado || 0)
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");
        XLSX.writeFile(workbook, `Consolidado_Reservas_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Paisaje para más espacio
        const tableColumn = ["Hotel", "Cliente", "Habitaciones", "Entrada", "Salida", "Total", "Abonado", "Saldo"];
        const tableRows = filteredReservas.map(r => [
            r.hotel,
            r.cliente_nombre?.toUpperCase(),
            r.habitaciones_desc,
            moment.utc(r.fecha_entrada).format('DD/MM/YYYY'),
            moment.utc(r.fecha_salida).format('DD/MM/YYYY'),
            `$${formatCurrency(r.valor_total)}`,
            `$${formatCurrency(r.valor_abonado)}`,
            `$${formatCurrency((r.valor_total || 0) - (r.valor_abonado || 0))}`
        ]);

        doc.setFontSize(18);
        doc.text("Consolidado Global de Reservas", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Rango: ${fechaInicio} al ${fechaFin}`, 14, 30);
        doc.text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 8 }
        });

        doc.save(`Consolidado_Reservas_${new Date().getTime()}.pdf`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-500 font-bold">Consolidando reservaciones de ambos hoteles...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                        <div className="p-2 bg-indigo-100 rounded-2xl text-indigo-600">
                            <Building2 size={28} />
                        </div>
                        Consolidado de Reservas
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">Vista global de ocupación de la cadena hotelera</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <button 
                            onClick={() => setHotelFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hotelFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setHotelFilter('plaza')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hotelFilter === 'plaza' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Plaza
                        </button>
                        <button 
                            onClick={() => setHotelFilter('colonial')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hotelFilter === 'colonial' ? 'bg-white text-amber-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Colonial
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 px-3 border-r border-gray-200">
                            <Calendar size={14} className="text-gray-400" />
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-[11px] font-black text-gray-600 focus:ring-0 p-0"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <input 
                                type="date" 
                                className="bg-transparent border-none text-[11px] font-black text-gray-600 focus:ring-0 p-0"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={fetchConsolidated}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <div className="flex items-center gap-2 border-l pl-3 ml-1 border-gray-200">
                        <button 
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all shadow-sm"
                        >
                            <FileSpreadsheet size={16} />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all shadow-sm"
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar por cliente o documento..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-400 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky-header">
                            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="p-4">Hotel</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Habitaciones</th>
                                <th className="p-4">Fechas</th>
                                <th className="p-4">Total</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedReservas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="text-gray-200 mb-2" size={48} />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay reservas en este periodo</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedReservas.map((r, idx) => (
                                    <tr key={`${r.hotel_id}-${r.id || idx}`} className="hover:bg-indigo-50/20 transition-colors">
                                        <td className="p-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit text-[10px] font-black uppercase tracking-tight ${
                                                r.hotel_id === 'plaza' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                <Hotel size={12} />
                                                {r.hotel}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800 uppercase text-sm">{r.cliente_nombre}</div>
                                            <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                                <User size={10} /> {r.documento}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                                                {r.habitaciones_desc}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-black text-slate-700">
                                                {moment.utc(r.fecha_entrada).format('DD MMM')} — {moment.utc(r.fecha_salida).format('DD MMM')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold">
                                                {moment.utc(r.fecha_salida).diff(moment.utc(r.fecha_entrada), 'days')} noches
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-black text-slate-800">$ {formatCurrency(r.valor_total)}</div>
                                            <div className="text-[10px] text-emerald-600 font-bold">Pagado: $ {formatCurrency(r.valor_abonado)}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => generateVoucher({ ...r, tipo: 'reserva' })}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                                    title="Imprimir Voucher"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    currentPage={currentPage}
                    totalItems={filteredReservas.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
    );
};

export default ReservasConsolidadas;
