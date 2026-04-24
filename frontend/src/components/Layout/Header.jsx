import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { User, Menu, ExternalLink } from 'lucide-react';

const Header = ({ setSidebarOpen }) => {
    const { user } = useContext(AuthContext);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 w-full relative print:hidden">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="mr-2 lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
                
                {/* Identidad del Hotel */}
                <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl mr-4 shadow-sm">
                    <img src="/logo.jpg" alt="Logo Hotel Plaza" className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-white" />
                    <div className="flex flex-col">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">Hotel Balcón Plaza</h2>
                    </div>
                </div>

                {/* Botón de Cambio de Hotel */}
                <a 
                    href="https://www.hotelbalconcolonial.com/login"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
                    title="Ir a Hotel Colonial"
                >
                    <ExternalLink size={14} className="text-amber-500" />
                    <span>Ir a Colonial</span>
                </a>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">{user?.rol_id === 1 || user?.rol_nombre === 'Admin' || user?.nombre === 'Administrador' ? 'Administrador' : 'Empleado'}</p>
                </div>
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 shrink-0">
                    <User size={20} />
                </div>
            </div>
        </header>
    );
};

export default Header;
