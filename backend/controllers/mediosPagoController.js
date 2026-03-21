const { poolPromise, sql } = require('../config/db');

exports.getMediosPago = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM medios_pago ORDER BY nombre ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMedioPago = async (req, res) => {
    try {
        const { nombre } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('usuario', sql.VarChar, req.userName)
            .query('INSERT INTO medios_pago (nombre, UsuarioCreacion) VALUES (@nombre, @usuario)');
        res.status(201).json({ message: 'Medio de pago creado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMedioPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('usuario', sql.VarChar, req.userName)
            .query('UPDATE medios_pago SET nombre = @nombre, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
        res.json({ message: 'Medio de pago actualizado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMedioPago = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Check if in use
        const registros = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM registros WHERE medio_pago_id = @id');
            
        if (registros.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar un medio de pago que está en uso en los registros.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM medios_pago WHERE id=@id');
        res.json({ message: 'Medio de pago eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
