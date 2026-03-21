const { poolPromise, sql } = require('../config/db');

const categoriasController = {
    // Obtener todas las categorías
    getAllCategorias: async (req, res) => {
        try {
            const pool = await poolPromise;
            const { recordset } = await pool.request().query('SELECT * FROM categorias_productos ORDER BY nombre ASC');
            res.json(recordset);
        } catch (error) {
            console.error('Error getting categorias:', error);
            res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
        }
    },

    // Crear categoría
    createCategoria: async (req, res) => {
        try {
            let { nombre, descripcion } = req.body;

            // Basic validation
            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
            }

            nombre = nombre.trim(); // Preserve casing as requested by user

            const pool = await poolPromise;

            // Check if exists
            const checkResult = await pool.request()
                .input('check_nombre', sql.VarChar(50), nombre)
                .query('SELECT id FROM categorias_productos WHERE nombre = @check_nombre');
                
            if (checkResult.recordset.length > 0) {
                return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
            }

            // Insert new category
            const query = `
                INSERT INTO categorias_productos (nombre, descripcion, activo) 
                OUTPUT inserted.*
                VALUES (@nombre, @descripcion, 1)
            `;

            const request = pool.request();
            request.input('nombre', sql.VarChar(50), nombre);
            request.input('descripcion', sql.VarChar(255), descripcion || null);

            const result = await request.query(query);

            res.status(201).json(result.recordset[0]);
        } catch (error) {
            console.error('Error creating categoria:', error);
            res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
        }
    },

    // Actualizar categoría
    updateCategoria: async (req, res) => {
        try {
            const { id } = req.params;
            let { nombre, descripcion } = req.body;

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
            }

            nombre = nombre.trim();

            const pool = await poolPromise;

            // Verificamos si existe otra categoria con este nombre
            const check = await pool.request()
                .input('check_nombre', sql.VarChar(50), nombre)
                .input('check_id', sql.Int, id)
                .query('SELECT id FROM categorias_productos WHERE nombre = @check_nombre AND id != @check_id');
                
            if(check.recordset.length > 0) {
                return res.status(400).json({ message: 'Ya existe otra categoría con este nombre' });
            }

            const query = `
                UPDATE categorias_productos 
                SET nombre = @nombre,
                    descripcion = @descripcion
                OUTPUT inserted.*
                WHERE id = @id
            `;

            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('nombre', sql.VarChar(50), nombre);
            request.input('descripcion', sql.VarChar(255), descripcion || null);

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error updating categoria:', error);
            res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
        }
    },

    // Cambiar estado (Activo/Inactivo)
    toggleCategoriaActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;

            const query = `
                UPDATE categorias_productos 
                SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END
                OUTPUT inserted.activo
                WHERE id = @id
            `;

            const request = pool.request();
            request.input('id', sql.Int, id);

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
            
            // Idealmente aquí podríamos revisar si se usa en productos antes de eliminar, 
            // pero estamos usando string en la base de datos de productos.
            // Para mantener simple, permitimos eliminar o marcar inactivo.
            
            const query = `DELETE FROM categorias_productos WHERE id = @id`;
            const request = pool.request();
            request.input('id', sql.Int, id);

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }

            res.json({ message: 'Categoría eliminada exitosamente' });
        } catch (error) {
            console.error('Error deleting categoria:', error);
            res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
        }
    }
};

module.exports = categoriasController;
