import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { User } from 'lucide-react';

const Header = () => {
    const { user } = useContext(AuthContext);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex-1">
                {/* Posible buscador o breadcrumbs */}
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">{user?.rol_id === 1 ? 'Administrador' : 'Empleado'}</p>
                </div>
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <User size={20} />
                </div>
            </div>
        </header>
    );
};

export default Header;
