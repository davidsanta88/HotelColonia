import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationOverlay from '../common/NotificationOverlay';
import useCashAlert from '../../hooks/useCashAlert';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Alerta de Tesorería para Admin
    useCashAlert();

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                    <NotificationOverlay />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

