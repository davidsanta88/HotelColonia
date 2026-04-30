import { useEffect, useContext, useState } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const useCashAlert = () => {
    const { user } = useContext(AuthContext);
    const [hasAlerted, setHasAlerted] = useState(false);

    useEffect(() => {
        const checkCashThreshold = async () => {
            if (!user) return;
            
            // Permitir para Administrador, SuperAdmin y Supervisor
            const isAuthorized = user?.rol_id === 1 || 
                               user?.rol_nombre?.toLowerCase()?.includes('admin') || 
                               user?.rol_nombre?.toLowerCase()?.includes('supervisor') ||
                               user?.nombre === 'Administrador' ||
                               user?.email === 'admin@hotel.com';
            
            if (!isAuthorized || hasAlerted) return;

            try {
                // 1. Obtener el último cierre primero para tener la base y el punto de partida
                const cierresRes = await api.get('/cierres-caja');
                let base = 0;
                let lastClosureDate = new Date();
                lastClosureDate.setHours(0, 0, 0, 0); // Default a inicio del día

                if (cierresRes.data && cierresRes.data.length > 0) {
                    const ultimo = cierresRes.data[0];
                    base = ultimo.medios_pago?.efectivo || ultimo.saldo_real || ultimo.saldo_calculado || 0;
                    lastClosureDate = new Date(ultimo.fecha);
                }

                // 2. Obtener la configuración para el monto límite
                const configRes = await api.get('/hotel-config');
                const threshold = configRes.data.montoAlertaCaja;

                if (!threshold || threshold <= 0) return;

                // 3. Obtener los datos de caja actuales DESDE el último cierre hasta ahora
                // Usamos la fecha exacta del cierre para no duplicar lo que ya se cerró
                const params = new URLSearchParams({
                    inicio: lastClosureDate.toISOString(),
                    fin: new Date().toISOString()
                });
                
                const cuadreRes = await api.get(`/reportes/cuadre-caja?${params.toString()}`);
                const currentCash = (cuadreRes.data.resumen.total_efectivo || 0) + base;

                if (currentCash > threshold) {
                    setHasAlerted(true);
                    Swal.fire({
                        title: '⚠️ ¡ALERTA DE SEGURIDAD EN CAJA!',
                        html: `
                            <div class="text-left space-y-6 mt-4">
                                <div class="flex items-center gap-4 bg-rose-600 p-5 rounded-2xl text-white shadow-xl animate-pulse">
                                    <div class="bg-white/20 p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-black uppercase tracking-widest text-[10px] opacity-80 leading-none mb-1">Riesgo por exceso de efectivo</p>
                                        <p class="text-xl font-black leading-tight">Límite de seguridad superado</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efectivo en Caja</p>
                                        <p class="text-2xl font-black text-slate-900 leading-none mt-1">$${new Intl.NumberFormat().format(currentCash)}</p>
                                    </div>
                                    <div class="bg-rose-50 p-4 rounded-2xl border-2 border-rose-100">
                                        <p class="text-[9px] font-black text-rose-400 uppercase tracking-widest">Límite Máximo</p>
                                        <p class="text-2xl font-black text-rose-600 leading-none mt-1">$${new Intl.NumberFormat().format(threshold)}</p>
                                    </div>
                                </div>

                                <div class="bg-amber-50 p-5 rounded-2xl border-2 border-amber-200 relative overflow-hidden">
                                    <div class="relative z-10">
                                        <p class="text-[10px] font-black text-amber-700 uppercase tracking-widest">⚠️ PROCEDIMIENTO DE SEGURIDAD:</p>
                                        <p class="text-[13px] text-amber-900 font-bold mt-2 leading-relaxed">
                                            Se ha detectado un excedente de <span class="text-rose-600 font-black">$${new Intl.NumberFormat().format(currentCash - threshold)}</span> sobre el límite permitido. 
                                            Por su seguridad, realice un <b>Recaudo Parcial</b> o un <b>Cierre de Caja</b> inmediatamente para retirar el dinero de la recepción.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `,
                        icon: undefined,
                        confirmButtonText: 'IR A CUADRE DE CAJA',
                        showCancelButton: true,
                        cancelButtonText: 'ENTENDIDO',
                        confirmButtonColor: '#e11d48',
                        cancelButtonColor: '#1e293b',
                        background: '#ffffff',
                        backdrop: `rgba(153, 27, 27, 0.4)`,
                        width: '32rem',
                        padding: '2rem',
                        customClass: {
                            popup: 'rounded-[2.5rem] border-0 shadow-2xl',
                            confirmButton: 'rounded-xl font-black px-6 py-3 uppercase text-xs tracking-widest mr-2',
                            cancelButton: 'rounded-xl font-black px-6 py-3 uppercase text-xs tracking-widest'
                        },
                        buttonsStyling: true,
                        footer: '<span class="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center w-full">Seguridad Balcón Hoteles - Monitoreo en Tiempo Real</span>'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/cuadre-caja';
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking cash threshold:', error);
            }
        };

        if (user && !hasAlerted) {
            checkCashThreshold();
        }
    }, [user, hasAlerted]);

    return null;
};

export default useCashAlert;
