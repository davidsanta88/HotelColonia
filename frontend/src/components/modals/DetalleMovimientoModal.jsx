import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    X, 
    Receipt, 
    ShoppingBag, 
    Calendar, 
    DollarSign, 
    User, 
    Info, 
    FileText, 
    CreditCard, 
    Clock,
    TrendingUp,
    TrendingDown,
    Home
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import moment from 'moment';

const DetalleMovimientoModal = ({ isOpen, onClose, transaccion }) => {
    const [loading, setLoading] = useState(true);
    const [detalle, setDetalle] = useState(null);

    useEffect(() => {
        if (isOpen && transaccion?.id_ref) {
            fetchDetalle();
        } else {
            setDetalle(null);
        }
    }, [isOpen, transaccion]);

    const [error, setError] = useState(null);

    const fetchDetalle = async () => {
        setLoading(true);
        setError(null);
        setDetalle(null);
        try {
            let endpoint = '';
            const tipo = transaccion.tipo;
            
            if (tipo === 'VENTA') endpoint = `/ventas/${transaccion.id_ref}`;
            else if (tipo === 'GASTO' || tipo === 'INGRESO MANUAL') endpoint = `/gastos/${transaccion.id_ref}`;
            else if (tipo === 'RESERVA') endpoint = `/reservas/${transaccion.id_ref}`;
            
            console.log(`[DEBUG] Fetching detail from: ${endpoint} for type: ${tipo} (ID: ${transaccion.id_ref})`);

            if (endpoint) {
                const res = await api.get(endpoint);
                console.log('[DEBUG] API Response for detail:', res.data);
                
                const finalData = res.data?.data || res.data;
                
                // Si llegamos aquí y finalData no tiene lo mínimo (monto o total), logueamos
                if (!finalData || (!finalData.total && !finalData.monto && !finalData.valor_total)) {
                    console.warn('[DEBUG] Received empty or unexpected data structure for detail:', finalData);
                }

                setDetalle(finalData);
            }
        } catch (err) {
            console.error('[ERROR] Error fetching transaction detail:', err);
            setError('No se pudieron obtener los detalles del servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderVentaDetail = () => {
        // Fallback: Si no hay detalle pero tenemos información en la transacción global
        const items = detalle?.items || detalle?.productos || [];
        const isActuallyEmpty = !loading && !error && items.length === 0;

        if (error) {
            return (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 mb-4">
                    <p className="text-red-500 font-bold text-xs uppercase tracking-widest">{error}</p>
                    <p className="text-[10px] text-red-400 mt-1">Intente nuevamente más tarde.</p>
                </div>
            );
        }
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Total Venta</p>
                        <p className="text-2xl font-black text-purple-700">${formatCurrency(detalle?.total || detalle?.monto || transaccion?.monto)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-purple-500 shadow-sm">
                        <ShoppingBag size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</th>
                                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3">
                                        <p className="font-bold text-gray-800 text-sm">{item.productoNombre || item.producto?.nombre || 'Articulo'}</p>
                                        <p className="text-[10px] text-gray-400 font-medium italic">PU: {formatCurrency(item.precioUnitario || item.precio)}</p>
                                    </td>
                                    <td className="p-3 text-center font-bold text-gray-600 text-sm">
                                        {item.cantidad}
                                    </td>
                                    <td className="p-3 text-right font-black text-gray-800 text-sm">
                                        ${formatCurrency(item.subtotal || (item.cantidad * (item.precioUnitario || item.precio)))}
                                    </td>
                                </tr>
                            ))}
                            {isActuallyEmpty && (
                                <tr>
                                    <td colSpan="3" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        <ShoppingBag size={24} className="mx-auto mb-2 opacity-20" />
                                        Sin items registrados para esta venta
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {detalle?.medioPago && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm border border-gray-50">
                            <CreditCard size={16} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Medio de Pago</p>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">{detalle.medioPago}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderGastoDetail = () => {
        if (error) {
            return (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 mb-4">
                    <p className="text-red-500 font-bold text-xs uppercase tracking-widest">{error}</p>
                    <p className="text-[10px] text-red-400 mt-1">Intente nuevamente más tarde.</p>
                </div>
            );
        }

        if (!detalle) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron datos del gasto/ingreso.</div>;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`p-6 rounded-2xl border flex items-center justify-between ${transaccion.tipo === 'GASTO' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${transaccion.tipo === 'GASTO' ? 'text-red-400' : 'text-emerald-400'}`}>Monto</p>
                        <p className={`text-2xl font-black ${transaccion.tipo === 'GASTO' ? 'text-red-700' : 'text-emerald-700'}`}>
                            ${formatCurrency(Math.abs(detalle?.monto || transaccion?.monto || 0))}
                        </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm ${transaccion.tipo === 'GASTO' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {transaccion.tipo === 'GASTO' ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-100"></div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Concepto / Descripción</h4>
                        <p className="text-sm font-bold text-gray-700 leading-relaxed italic border-l-2 border-slate-50 pl-3">
                            "{detalle?.descripcion || transaccion?.descripcion || 'Sin descripción'}"
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoría</h4>
                            <span className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-600 uppercase border border-gray-100 inline-block tracking-widest shadow-sm">
                                {detalle?.categoria?.nombre || 'General'}
                            </span>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Medio de Pago</h4>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase">
                                <CreditCard size={12} className="text-gray-300" />
                                {detalle?.medioPago || transaccion?.medioPago || 'Efectivo'}
                            </div>
                        </div>
                    </div>
                </div>

                {(detalle?.observaciones || transaccion?.observaciones) && (
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones Adicionales</h4>
                        <p className="text-xs text-gray-500 italic leading-relaxed">
                            {detalle?.observaciones || transaccion?.observaciones}
                        </p>
                    </div>
                )}

                {detalle?.comprobante_url && (
                    <div className="flex justify-center pt-2">
                        <a 
                            href={detalle.comprobante_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 active:scale-95"
                        >
                            <FileText size={16} /> Ver Comprobante Adjunto
                        </a>
                    </div>
                )}
            </div>
        );
    };

    const renderReservaDetail = () => {
        if (error) {
            return (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 mb-4">
                    <p className="text-red-500 font-bold text-xs uppercase tracking-widest">{error}</p>
                    <p className="text-[10px] text-red-400 mt-1">Intente nuevamente más tarde.</p>
                </div>
            );
        }

        if (!detalle) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron datos de la reserva.</div>;
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Valor de la Reserva</p>
                        <p className="text-2xl font-black text-amber-700">${formatCurrency(detalle?.valor_total || detalle?.total)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                        <Calendar size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-100/50"></div>
                    <div className="grid grid-cols-2 gap-4 ml-2">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cliente / Huesped</label>
                            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm truncate">
                                <User size={16} className="text-gray-300" />
                                <span className="truncate">{detalle?.cliente?.nombre || detalle?.cliente_nombre || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Estado Reserva</label>
                            <span className="px-3 py-1 bg-amber-100 rounded-lg text-[9px] font-black text-amber-800 uppercase border border-amber-200 inline-block tracking-widest">
                                {detalle?.estado || 'Confirmada'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-5 ml-2">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha Check-in</label>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <Calendar size={14} className="text-gray-300" />
                                {moment(detalle?.fecha_entrada || detalle?.checkIn).format('DD/MM/YYYY')}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha Check-out</label>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <Calendar size={14} className="text-gray-300" />
                                {moment(detalle?.fecha_salida || detalle?.checkOut).format('DD/MM/YYYY')}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-50 pt-5 ml-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Habitaciones Asignadas</label>
                        <div className="flex flex-wrap gap-2">
                            {(detalle?.habitaciones || []).map((h, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-100 flex items-center gap-2 shadow-sm transition-all hover:scale-105">
                                    <Home size={12} /> Hab #{h.numero || h.habitacion?.numero}
                                </span>
                            ))}
                            {(!detalle?.habitaciones || detalle.habitaciones.length === 0) && (
                                <span className="text-[10px] text-gray-400 italic">Sin habitaciones específicas</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getIcon = () => {
        const types = {
            'VENTA': <ShoppingBag className="text-purple-500" />,
            'GASTO': <TrendingDown className="text-red-500" />,
            'INGRESO MANUAL': <TrendingUp className="text-emerald-500" />,
            'RESERVA': <Calendar className="text-amber-500" />,
            'HOSPEDAJE': <Receipt className="text-blue-500" />
        };
        return types[transaccion?.tipo] || <Info className="text-gray-500" />;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto h-full w-full flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-800 leading-none mb-1">Detalle de {transaccion?.tipo}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Ref: {transaccion?.id_ref?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm border border-transparent hover:border-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3">
                            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Obteniendo detalles...</p>
                        </div>
                    ) : (
                        <>
                            {transaccion?.tipo === 'VENTA' && renderVentaDetail()}
                            {(transaccion?.tipo === 'GASTO' || transaccion?.tipo === 'INGRESO MANUAL') && renderGastoDetail()}
                            {transaccion?.tipo === 'RESERVA' && renderReservaDetail()}

                            <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block mb-1">Fecha de Registro</label>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                        <Clock size={14} className="text-gray-300" />
                                        {moment(detalle?.fecha || detalle?.fechaCreacion || transaccion?.fecha).format('DD/MM/YYYY HH:mm')}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block mb-1">Registrado por</label>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                        <User size={14} className="text-gray-300" />
                                        <span className="truncate">{detalle?.usuarioCreacion || detalle?.usuario?.nombre || detalle?.empleado?.nombre || transaccion?.usuario || 'Sistema'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-5 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-10 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                    >
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleMovimientoModal;
