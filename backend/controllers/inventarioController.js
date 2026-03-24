const { poolPromise, sql } = require('../config/db');

exports.getMovimientos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT m.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
            FROM inventario_movimientos m
            JOIN productos p ON m.producto_id = p.id
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            ORDER BY m.fecha DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createMovimiento = async (req, res) => {
    try {
        const { producto_id, tipo, cantidad, motivo } = req.body;
        const usuario_id = req.userId;
        const pool = await poolPromise;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Insertar movimiento
            await transaction.request()
                .input('producto_id', sql.Int, producto_id)
                .input('tipo', sql.VarChar, tipo)
                .input('cantidad', sql.Int, cantidad)
                .input('motivo', sql.VarChar, motivo)
                .input('usuario_id', sql.Int, usuario_id)
                .input('usuario', sql.VarChar, req.userName)
                .query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, usuario_id, UsuarioCreacion) VALUES (@producto_id, @tipo, @cantidad, @motivo, @usuario_id, @usuario)');
            
            // Actualizar stock en productos
            const stockChange = tipo === 'entrada' ? cantidad : -cantidad;
            await transaction.request()
                .input('producto_id', sql.Int, producto_id)
                .input('cantidad', sql.Int, stockChange)
                .input('usuario', sql.VarChar, req.userName)
                .query('UPDATE productos SET stock = stock + @cantidad, UsuarioModificacion = @usuario, FechaModificacion = GETDATE() WHERE id = @producto_id');

            await transaction.commit();
            res.status(201).json({ message: 'Movimiento registrado con éxito' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStockAlerts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM productos WHERE stock <= stock_minimo');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
