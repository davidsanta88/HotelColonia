const { poolPromise, sql } = require('../config/db');

exports.getMunicipios = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM municipios ORDER BY nombre ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMunicipio = async (req, res) => {
    try {
        const { nombre, visualizar } = req.body;
        const pool = await poolPromise;
        const visualizarVal = visualizar !== undefined ? (visualizar ? 1 : 0) : 1;
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('visualizar', sql.Bit, visualizarVal)
            .input('usuario', sql.VarChar, req.userName)
            .query('INSERT INTO municipios (nombre, visualizar, UsuarioCreacion) VALUES (@nombre, @visualizar, @usuario)');
        res.status(201).json({ message: 'Municipio creado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, visualizar } = req.body;
        const pool = await poolPromise;
        const visualizarVal = visualizar !== undefined ? (visualizar ? 1 : 0) : 1;
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('visualizar', sql.Bit, visualizarVal)
            .input('usuario', sql.VarChar, req.userName)
            .query('UPDATE municipios SET nombre = @nombre, visualizar = @visualizar, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @id');
        res.json({ message: 'Municipio actualizado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMunicipio = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Verificar si está en uso por algún cliente
        const verify = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM clientes WHERE municipio_origen_id = @id');
            
        if (verify.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar el municipio porque existen clientes asociados a él.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM municipios WHERE id = @id');
        res.json({ message: 'Municipio eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
