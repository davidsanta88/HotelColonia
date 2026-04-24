import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { User, Menu, RefreshCw } from 'lucide-react';

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
                
                {/* Botón de Cambio de Hotel */}
                <a 
                    href="https://www.hotelbalconcolonial.com/login"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
                    title="Ir a Hotel Colonial"
                >
                    <RefreshCw size={14} className="text-amber-500" />
                    <span>Ir a Hotel Colonial</span>
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
