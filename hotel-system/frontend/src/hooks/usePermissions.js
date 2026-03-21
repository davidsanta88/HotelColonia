import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook para validar permisos granulares por pantalla
 * @param {string} screenCode - El código de la pantalla (ej: 'clientes', 'reservas')
 * @returns {object} { canView, canEdit, canDelete }
 */
export const usePermissions = (screenCode) => {
    const { user } = useContext(AuthContext);

    // Bypass total para Administradores de Sistema (Rol 1)
    if (user?.rol_id === 1) {
        return { canView: true, canEdit: true, canDelete: true };
    }

    // Buscar el permiso específico en el array del usuario
    // El formato esperado es [{ p: 'codigo', v: 1, e: 0, d: 0 }, ...]
    const permission = user?.permisos?.find(p => p.p === screenCode);

    return {
        canView: !!permission?.v,
        canEdit: !!permission?.e,
        canDelete: !!permission?.d
    };
};
