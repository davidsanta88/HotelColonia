import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bed, UserCheck, CalendarDays, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
    const [stats, setStats] = useState({
        habitacionesDisponibles: 0,
        habitacionesOcupadas: 0,
        registrosHoy: 0,
        ventasHoy: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch rooms
                const { data: habitaciones } = await api.get('/habitaciones');
                const disponibles = habitaciones.filter(h => h.estado === 'disponible').length;
                const ocupadas = habitaciones.filter(h => h.estado === 'ocupada').length;

                // Fetch auth
                const { data: registros } = await api.get('/registros');
                const hoy = new Date().toISOString().split('T')[0];
                const registrosHoy = registros.filter(r => r.fecha_ingreso.split('T')[0] === hoy).length;

                // Fetch sales
                const { data: ventas } = await api.get('/ventas');
                const ventasHoy = ventas.filter(v => v.fecha.split('T')[0] === hoy)
                                        .reduce((acc, current) => acc + current.total, 0);

                setStats({
                    habitacionesDisponibles: disponibles,
                    habitacionesOcupadas: ocupadas,
                    registrosHoy,
                    ventasHoy
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div>Cargando estadísticas...</div>;

    const cards = [
        { title: 'Hab. Disponibles', value: stats.habitacionesDisponibles, icon: <Bed size={32} />, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Hab. Ocupadas', value: stats.habitacionesOcupadas, icon: <UserCheck size={32} />, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Registros del Día', value: stats.registrosHoy, icon: <CalendarDays size={32} />, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Ventas de Tienda', value: `$${formatCurrency(stats.ventasHoy)}`, icon: <DollarSign size={32} />, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Resumen general del hotel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="card p-6 flex items-center space-x-4">
                        <div className={`p-4 rounded-full ${card.bg} ${card.color}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h2>
                <p className="text-gray-500 text-sm">Próximamente... Listado de últimos registros y llegadas.</p>
            </div>
        </div>
    );
};

export default Dashboard;
