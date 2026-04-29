import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Search, 
    Building2, 
    Phone, 
    Mail, 
    MapPin, 
    FileText, 
    Info,
    Building
} from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermissions } from '../hooks/usePermissions';
import Pagination from '../components/common/Pagination';

const Empresas = () => {
    const { user } = useContext(AuthContext);
    const { canEdit, canDelete } = usePermissions('configuracion'); 
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [currentEmpresa, setCurrentEmpresa] = useState({
        razon_social: '',
        nit: '',
        direccion: '',
        telefono: '',
        email: '',
        observacion: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    
    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        try {
            const res = await api.get('/empresas');
            setEmpresas(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching empresas:', error);
            setLoading(false);
            Swal.fire('Error', 'No se pudieron cargar las empresas', 'error');
        }
    };

    const handleOpenModal = (empresa = null) => {
        if (empresa) {
            setCurrentEmpresa({
                ...empresa
            });
            setIsEditing(true);
        } else {
            setCurrentEmpresa({ 
                razon_social: '', 
                nit: '', 
                direccion: '', 
                telefono: '', 
                email: '', 
                observacion: '' 
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentEmpresa({ 
            razon_social: '', 
            nit: '', 
            direccion: '', 
            telefono: '', 
            email: '', 
            observacion: '' 
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/empresas/${currentEmpresa._id || currentEmpresa.id}`, currentEmpresa);
                Swal.fire('Éxito', 'Empresa actualizada correctamente', 'success');
            } else {
                await api.post('/empresas', currentEmpresa);
                Swal.fire('Éxito', 'Empresa registrada correctamente', 'success');
            }
            handleCloseModal();
            fetchEmpresas();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar empresa', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Si la empresa tiene clientes vinculados, no podrá ser eliminada.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/empresas/${id}`);
                Swal.fire('Eliminado!', 'La empresa ha sido eliminada.', 'success');
                fetchEmpresas();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar la empresa', 'error');
            }
        }
    };

    const filteredEmpresas = useMemo(() => {
        return empresas.filter(e => 
            e.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.nit?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [empresas, searchTerm]);

    const paginatedEmpresas = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmpresas.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmpresas, currentPage, itemsPerPage]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando empresas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Empresas</h1>
                    <p className="text-slate-500 font-medium">Gestione los convenios y entidades corporativas</p>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Building2 size={18} /> Nueva Empresa
                    </button>
                )}
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIT..."
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">NIT</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Razón Social</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEmpresas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Building className="text-slate-100 mb-2" size={48} />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No se encontraron empresas</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmpresas.map(empresa => (
                                    <tr key={empresa._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800 font-mono text-sm">{empresa.nit}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 uppercase">{empresa.razon_social}</div>
                                            {empresa.observacion && (
                                                <div className="text-[10px] text-gray-400 italic truncate max-w-xs">{empresa.observacion}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Phone size={12} className="text-slate-300" />
                                                <span className="font-bold">{empresa.telefono || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={12} className="text-slate-300" />
                                                <span className="text-[10px]">{empresa.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-slate-300" />
                                                <span>{empresa.direccion || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => handleOpenModal(empresa)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => handleDelete(empresa._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
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
                    totalItems={filteredEmpresas.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Modal para Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">
                                    {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
                                </h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Maestro de Entidades</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">NIT / Identificación *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        value={currentEmpresa.nit}
                                        onChange={e => setCurrentEmpresa({...currentEmpresa, nit: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Razón Social *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none uppercase"
                                        value={currentEmpresa.razon_social}
                                        onChange={e => setCurrentEmpresa({...currentEmpresa, razon_social: e.target.value.toUpperCase()})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Dirección Física</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    value={currentEmpresa.direccion}
                                    onChange={e => setCurrentEmpresa({...currentEmpresa, direccion: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Teléfono Corporativo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        value={currentEmpresa.telefono}
                                        onChange={e => setCurrentEmpresa({...currentEmpresa, telefono: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email de Contacto</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        value={currentEmpresa.email}
                                        onChange={e => setCurrentEmpresa({...currentEmpresa, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Observaciones / Convenio</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none min-h-[100px]"
                                    placeholder="Detalles del convenio o notas especiales..."
                                    value={currentEmpresa.observacion || ''}
                                    onChange={e => setCurrentEmpresa({...currentEmpresa, observacion: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 mt-8 pt-4">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">
                                    Guardar Empresa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Empresas;

