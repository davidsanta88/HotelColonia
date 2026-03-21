const { poolPromise, sql } = require('../config/db');

exports.getClientes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.*, m.nombre as municipio_nombre 
            FROM clientes c
            LEFT JOIN municipios m ON c.municipio_origen_id = m.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCliente = async (req, res) => {
    try {
        const { nombre, documento, tipo_documento, telefono, email, municipio_origen_id } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('documento', sql.VarChar, documento)
            .input('tipo_documento', sql.VarChar, tipo_documento || 'CC')
            .input('telefono', sql.VarChar, telefono || null)
            .input('email', sql.VarChar, email || null)
            .input('municipio_origen_id', sql.Int, municipio_origen_id || null)
            .input('usuario', sql.VarChar, req.userName)
            .query('INSERT INTO clientes (nombre, documento, tipo_documento, telefono, email, municipio_origen_id, UsuarioCreacion) OUTPUT inserted.id VALUES (@nombre, @documento, @tipo_documento, @telefono, @email, @municipio_origen_id, @usuario)');
        
        res.status(201).json({ 
            message: 'Cliente registrado con éxito', 
            id: result.recordset[0].id 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, documento, tipo_documento, telefono, email, municipio_origen_id } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('documento', sql.VarChar, documento)
            .input('tipo_documento', sql.VarChar, tipo_documento || 'CC')
            .input('telefono', sql.VarChar, telefono || null)
            .input('email', sql.VarChar, email || null)
            .input('municipio_origen_id', sql.Int, municipio_origen_id || null)
            .input('usuario', sql.VarChar, req.userName)
            .query('UPDATE clientes SET nombre = @nombre, documento = @documento, tipo_documento = @tipo_documento, telefono = @telefono, email = @email, municipio_origen_id = @municipio_origen_id, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
        
        res.json({ message: 'Cliente actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Verificar si el cliente tiene registros antes de eliminar
        const registros = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM registros WHERE cliente_id = @id');
            
        if (registros.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar un cliente con registros asociados.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM clientes WHERE id=@id');
        
        res.json({ message: 'Cliente eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
