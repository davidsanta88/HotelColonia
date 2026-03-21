const { poolPromise, sql } = require('../config/db');

const gastosController = {
    getAllGastos: async (req, res) => {
        try {
            const { fechaInicio, fechaFin, categoria_id } = req.query;
            let query = `
                SELECT g.*, c.nombre as categoria_nombre 
                FROM gastos g
                LEFT JOIN categorias_gastos c ON g.categoria_id = c.id
                WHERE 1=1
            `;
            
            const pool = await poolPromise;
            const request = pool.request();

            if (fechaInicio) {
                query += ` AND g.fecha_gasto >= @fechaInicio`;
                request.input('fechaInicio', sql.DateTime, new Date(fechaInicio));
            }
            if (fechaFin) {
                // Agregar un día para incluir la fecha de fin por completo
                query += ` AND g.fecha_gasto < DATEADD(day, 1, @fechaFin)`;
                request.input('fechaFin', sql.DateTime, new Date(fechaFin));
            }
            if (categoria_id) {
                query += ` AND g.categoria_id = @categoria_id`;
                request.input('categoria_id', sql.Int, parseInt(categoria_id));
            }

            query += ` ORDER BY g.fecha_gasto DESC`;

            const { recordset } = await request.query(query);
            res.json(recordset);
        } catch (error) {
            console.error('Error getting gastos:', error);
            res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
        }
    },

    createGasto: async (req, res) => {
        try {
            const { concepto, categoria_id, monto, notas, fecha_gasto, tipo } = req.body;
            const imagen_url = req.file ? `/uploads/gastos/${req.file.filename}` : null;

            if (!concepto || !monto) {
                return res.status(400).json({ message: 'El concepto y monto son obligatorios' });
            }

            const pool = await poolPromise;
            const query = `
                INSERT INTO gastos (concepto, categoria_id, monto, notas, fecha_gasto, imagen_url, tipo, UsuarioCreacion) 
                OUTPUT inserted.*
                VALUES (@concepto, @categoria_id, @monto, @notas, ISNULL(@fecha_gasto, GETDATE()), @imagen_url, @tipo, @usuario)
            `;

            const request = pool.request();
            request.input('concepto', sql.VarChar(100), concepto.trim());
            request.input('categoria_id', sql.Int, categoria_id || null);
            request.input('monto', sql.Decimal(10,2), parseFloat(monto));
            request.input('notas', sql.VarChar(sql.MAX), notas || null);
            request.input('fecha_gasto', sql.DateTime, fecha_gasto ? new Date(fecha_gasto) : null);
            request.input('imagen_url', sql.VarChar(sql.MAX), imagen_url || null);
            request.input('tipo', sql.VarChar(20), tipo || 'Gasto');
            request.input('usuario', sql.VarChar(50), req.userName || 'Sistema');

            const result = await request.query(query);
            res.status(201).json(result.recordset[0]);
        } catch (error) {
            console.error('Error creating movement:', error);
            res.status(500).json({ message: 'Error al registrar el movimiento', error: error.message });
        }
    },
    
    deleteGasto: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await poolPromise;
            
            const query = `DELETE FROM gastos WHERE id = @id`;
            const request = pool.request();
            request.input('id', sql.Int, id);

            const result = await request.query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Gasto no encontrado' });
            }

            res.json({ message: 'Gasto eliminado exitosamente' });
        } catch (error) {
            console.error('Error deleting gasto:', error);
            res.status(500).json({ message: 'Error al eliminar el gasto', error: error.message });
        }
    },

    updateGasto: async (req, res) => {
        try {
            const { id } = req.params;
            const { concepto, categoria_id, monto, notas, fecha_gasto, tipo } = req.body;
            let imagen_url = req.body.imagen_url; // Mantener la actual por defecto
            
            if (req.file) {
                imagen_url = `/uploads/gastos/${req.file.filename}`;
            }

            if (!concepto || !monto) {
                return res.status(400).json({ message: 'El concepto y monto son obligatorios' });
            }

            const pool = await poolPromise;
            const query = `
                UPDATE gastos 
                SET concepto = @concepto, 
                    categoria_id = @categoria_id, 
                    monto = @monto, 
                    notas = @notas, 
                    fecha_gasto = @fecha_gasto, 
                    imagen_url = @imagen_url, 
                    tipo = @tipo
                WHERE id = @id
            `;

            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('concepto', sql.VarChar(100), concepto.trim());
            request.input('categoria_id', sql.Int, categoria_id || null);
            request.input('monto', sql.Decimal(10,2), parseFloat(monto));
            request.input('notas', sql.VarChar(sql.MAX), notas || null);
            request.input('fecha_gasto', sql.DateTime, fecha_gasto ? new Date(fecha_gasto) : new Date());
            request.input('imagen_url', sql.VarChar(sql.MAX), imagen_url || null);
            request.input('tipo', sql.VarChar(20), tipo || 'Gasto');

            const result = await request.query(query);
            
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ message: 'Gasto no encontrado' });
            }

            res.json({ message: 'Movimiento actualizado correctamente' });
        } catch (error) {
            console.error('Error updating movement:', error);
            res.status(500).json({ message: 'Error al actualizar el movimiento', error: error.message });
        }
    }
};

module.exports = gastosController;
