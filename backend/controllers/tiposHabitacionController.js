const { poolPromise, sql } = require('../config/db');

exports.getTiposHabitacion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM tipos_habitacion ORDER BY nombre ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTipoHabitacion = async (req, res) => {
    try {
        const { nombre } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('usuario', sql.VarChar, req.userName)
            .query('INSERT INTO tipos_habitacion (nombre, UsuarioCreacion) VALUES (@nombre, @usuario)');
        res.status(201).json({ message: 'Tipo de habitación creado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTipoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('usuario', sql.VarChar, req.userName)
            .query('UPDATE tipos_habitacion SET nombre = @nombre, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
        res.json({ message: 'Tipo de habitación actualizado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTipoHabitacion = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Verificar si está en uso por alguna habitación
        const verify = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM habitaciones WHERE tipo_id = @id');
            
        if (verify.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar el tipo porque existen habitaciones asociadas a él.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM tipos_habitacion WHERE id = @id');
        res.json({ message: 'Tipo de habitación eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
