import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const CategoriasProductos = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentCategoria, setCurrentCategoria] = useState({ id: null, nombre: '', descripcion: '' });

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const { data } = await api.get('/categorias');
            setCategorias(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/categorias/${currentCategoria.id}`, { nombre: currentCategoria.nombre, descripcion: currentCategoria.descripcion });
                Swal.fire('Éxito', 'Categoría actualizada', 'success');
            } else {
                await api.post('/categorias', { nombre: currentCategoria.nombre, descripcion: currentCategoria.descripcion });
                Swal.fire('Éxito', 'Categoría creada', 'success');
            }
            setShowModal(false);
            fetchCategorias();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/categorias/${id}`);
                Swal.fire('Eliminado', 'La categoría ha sido eliminada.', 'success');
                fetchCategorias();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar la categoría', 'error');
            }
        }
    };

    const handleToggleActivo = async (cat) => {
        try {
            await api.put(`/categorias/${cat.id}/toggle`);
            fetchCategorias();
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado de la categoría', 'error');
        }
    };

    const openModal = (cat = null) => {
        if (cat) {
            setCurrentCategoria(cat);
            setEditMode(true);
        } else {
            setCurrentCategoria({ id: null, nombre: '', descripcion: '' });
            setEditMode(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorías de Productos</h1>
                    <p className="text-sm text-gray-500">Administra las clasificaciones de los productos de tienda</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Nueva Categoría</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando categorías...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categorias.map((cat) => (
                                    <tr key={cat.id} className={`transition-colors ${cat.activo === false || cat.activo === 0 ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{cat.descripcion || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <ToggleSwitch
                                                    checked={cat.activo === true || cat.activo === 1}
                                                    onChange={() => handleToggleActivo(cat)}
                                                />
                                                <span className={`text-[10px] font-bold ${cat.activo === false || cat.activo === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                                                    {cat.activo === false || cat.activo === 0 ? 'Inactivo' : 'Activo'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(cat)} className="text-primary-600 hover:text-primary-900 mx-2 p-1 rounded-lg hover:bg-primary-50">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900 mx-2 p-1 rounded-lg hover:bg-red-50">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {categorias.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                                            No hay categorías registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-primary-600 p-6 text-white flex items-center space-x-3 mb-4">
                            <div className="bg-white/20 p-2 rounded-lg text-white">
                                <Package size={24} />
                            </div>
                            <h2 className="text-xl font-bold">{editMode ? 'Editar' : 'Nueva'} Categoría</h2>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 pt-0 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="input-field" 
                                    value={currentCategoria.nombre}
                                    placeholder="Ej. Bebidas, Snacks, Aseo..."
                                    onChange={e => setCurrentCategoria({...currentCategoria, nombre: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea 
                                    className="input-field min-h-[80px]" 
                                    value={currentCategoria.descripcion}
                                    onChange={e => setCurrentCategoria({...currentCategoria, descripcion: e.target.value})} 
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriasProductos;

