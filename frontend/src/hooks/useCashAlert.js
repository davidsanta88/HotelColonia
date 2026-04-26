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
            
            // Solo para Administrador o SuperAdmin
            const isSuperAdmin = user?.rol_id === 1 || 
                               user?.rol_nombre?.toLowerCase()?.includes('admin') || 
                               user?.nombre === 'Administrador' ||
                               user?.email === 'admin@hotel.com';
            
            if (!isSuperAdmin || hasAlerted) return;

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
                        title: '⚠️ ALERTA DE TESORERÍA',
                        html: `
                            <div class="text-left space-y-4 mt-4">
                                <p class="font-black text-rose-600 uppercase tracking-widest text-[10px] mb-1">Límite de efectivo superado</p>
                                <p class="text-sm text-slate-600 font-medium">El efectivo total en caja (incluyendo base) ha superado el límite de seguridad.</p>
                                
                                <div class="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efectivo en Caja</p>
                                        <p class="text-2xl font-black text-slate-900">$${new Intl.NumberFormat().format(currentCash)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Límite Permitido</p>
                                        <p class="text-lg font-black text-rose-500">$${new Intl.NumberFormat().format(threshold)}</p>
                                    </div>
                                </div>

                                <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                    <p class="text-[10px] font-black text-rose-700 uppercase tracking-widest">ACCIÓN RECOMENDADA:</p>
                                    <p class="text-xs text-rose-600 font-bold mt-1">Se recomienda realizar un recaudo parcial o cierre de caja para asegurar los fondos excedentes.</p>
                                </div>
                            </div>
                        `,
                        icon: 'warning',
                        confirmButtonText: 'ENTENDIDO',
                        confirmButtonColor: '#1e293b',
                        showCloseButton: true,
                        footer: '<span class="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center w-full">Esta notificación es automática y solo visible para administradores</span>'
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
