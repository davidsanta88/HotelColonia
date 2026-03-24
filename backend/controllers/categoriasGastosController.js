const { poolPromise, sql } = require('../config/db');

const categoriasGastosController = {
    // Obtener todas las categorías de gastos
    getAllCategorias: async (req, res) => {
        try {
            const pool = await poolPromise;
            const { recordset } = await pool.request().query('SELECT * FROM categorias_gastos ORDER BY tipo DESC, nombre ASC');
            res.json(recordset);
        } catch (error) {
            console.error('Error getting categorias de gastos/ingresos:', error);
            res.status(500).json({ message: 'Error al obtener categorías de gastos/ingresos', error: error.message });
        }
    },

    // Crear categoría de gasto
    createCategoria: async (req, res) => {
        try {
            let { nombre, descripcion, tipo } = req.body;

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
            }

            const pool = await poolPromise;

            // Check if exists
            const checkResult = await pool.request()
                .input('check_nombre', sql.VarChar(50), nombre.trim())
                .input('check_tipo', sql.VarChar(20), tipo || 'Gasto')
                .query('SELECT id FROM categorias_gastos WHERE RTRIM(LTRIM(LOWER(nombre))) = RTRIM(LTRIM(LOWER(@check_nombre))) AND tipo = @check_tipo');
                
            if (checkResult.recordset.length > 0) {
                return res.status(400).json({ message: `Ya existe una categoría de ${tipo || 'gasto'} con ese nombre` });
            }

            const query = `
                INSERT INTO categorias_gastos (nombre, descripcion, tipo, activo, UsuarioCreacion) 
                OUTPUT inserted.*
                VALUES (@nombre, @descripcion, @tipo, 1, @usuario)
            `;

            const request = pool.request();
            request.input('nombre', sql.VarChar(50), nombre.trim());
            request.input('descripcion', sql.VarChar(255), descripcion || null);
            request.input('tipo', sql.VarChar(20), tipo || 'Gasto');
            request.input('usuario', sql.VarChar(50), req.userName || 'Sistema');

            const result = await request.query(query);

            res.status(201).json(result.recordset[0]);
        } catch (error) {
            console.error('Error creating categoria de gasto:', error);
            res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
        }
    },

    // Actualizar categoría
    updateCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            let { nombre, descripcion, tipo } = req.body;

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
            }

            const pool = await poolPromise;

            // Verificamos si existe otra categoria con este nombre del mismo tipo
            const check = await pool.request()
                .input('check_nombre', sql.VarChar(50), nombre.trim())
                .input('check_tipo', sql.VarChar(20), tipo || 'Gasto')
                .input('check_id', sql.Int, id)
                .query('SELECT id FROM categorias_gastos WHERE RTRIM(LTRIM(LOWER(nombre))) = RTRIM(LTRIM(LOWER(@check_nombre))) AND tipo = @check_tipo AND id != @check_id');
                
            if(check.recordset.length > 0) {
                return res.status(400).json({ message: `Ya existe otra categoría de ${tipo || 'gasto'} con ese nombre` });
            }

            const query = `
                UPDATE categorias_gastos 
                SET nombre = @nombre,
                    descripcion = @descripcion,
                    tipo = @tipo,
                    UsuarioModificacion = @usuario,
                    FechaModificacion = GETDATE()
                OUTPUT inserted.*
                WHERE id = @id
            `;

            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('nombre', sql.VarChar(50), nombre.trim());
            request.input('descripcion', sql.VarChar(255), descripcion || null);
            request.input('tipo', sql.VarChar(20), tipo || 'Gasto');
            request.input('usuario', sql.VarChar(50), req.userName || 'Sistema');

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error updating categoria de gasto:', error);
            res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
        }
    },

    // Cambiar estado (Activo/Inactivo)
    toggleCategoriaActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;

            const query = `
                UPDATE categorias_gastos 
                SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END,
                    UsuarioModificacion = @usuario,
                    FechaModificacion = GETDATE()
                OUTPUT inserted.activo
                WHERE id = @id
            `;

            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('usuario', sql.VarChar(50), req.userName || 'Sistema');

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }

            res.json({ message: 'Estado actualizado', activo: result.recordset[0].activo });
        } catch (error) {
            console.error('Error toggling categoria status:', error);
            res.status(500).json({ message: 'Error al cambiar estado de categoría', error: error.message });
        }
    },

    // Eliminar categoría
    deleteCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;
            
            // Verificar si hay gastos usando esta categoría
            const checkGastos = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT COUNT(*) as num_gastos FROM gastos WHERE categoria_id = @id');
                
            if (checkGastos.recordset[0].num_gastos > 0) {
                return res.status(400).json({ message: 'No se puede eliminar la categoría porque ya tiene gastos asociados. Se recomienda desactivarla.' });
            }
            
            const query = `DELETE FROM categorias_gastos WHERE id = @id`;
            const request = pool.request();
            request.input('id', sql.Int, id);

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }

            res.json({ message: 'Categoría eliminada exitosamente' });
        } catch (error) {
            console.error('Error deleting categoria de gasto:', error);
            res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
        }
    }
};

module.exports = categoriasGastosController;
