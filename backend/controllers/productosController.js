const { poolPromise, sql } = require('../config/db');

exports.getProductos = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM productos');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProducto = async (req, res) => {
    console.log('Create Product Request Body:', req.body);
    console.log('Create Product Request File:', req.file);
    try {
        const { nombre, categoria, precio, stock, stock_minimo, descripcion, tipo_inventario } = req.body;
        const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

        if (!nombre) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const result = await transaction.request()
                .input('nombre', sql.VarChar(100), nombre.toString().trim())
                .input('categoria', sql.VarChar(50), (categoria || 'bebidas').toString())
                .input('precio', sql.Decimal(10,2), parseFloat(precio) || 0)
                .input('stock', sql.Int, parseInt(stock) || 0)
                .input('stock_minimo', sql.Int, parseInt(stock_minimo) || 0)
                .input('descripcion', sql.VarChar(sql.MAX), descripcion || null)
                .input('tipo_inventario', sql.VarChar(50), tipo_inventario || 'venta')
                .input('imagen_url', sql.VarChar(sql.MAX), imagen_url || null)
                .input('usuario', sql.NVarChar, req.userName || 'Sistema')
                .query('INSERT INTO productos (nombre, categoria, precio, stock, stock_minimo, descripcion, tipo_inventario, imagen_url, activo, UsuarioCreacion) OUTPUT inserted.id VALUES (@nombre, @categoria, @precio, @stock, @stock_minimo, @descripcion, @tipo_inventario, @imagen_url, 1, @usuario)');
            
            const producto_id = result.recordset[0].id;

            // Registrar movimiento inicial si hay stock
            if (stock > 0) {
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('tipo', sql.VarChar, 'entrada')
                    .input('cantidad', sql.Int, stock)
                    .input('motivo', sql.VarChar, 'stock inicial')
                    .input('usuario_id', sql.Int, req.userId)
                    .input('usuario_nombre', sql.VarChar, req.userName)
                    .query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, usuario_id, UsuarioCreacion) VALUES (@producto_id, @tipo, @cantidad, @motivo, @usuario_id, @usuario_nombre)');
            }

            await transaction.commit();
            res.status(201).json({ message: 'Producto creado con éxito' });
        } catch (err) {
            await transaction.rollback();
            console.error('Create Product Error:', err);
            throw err;
        }
    } catch (err) {
        console.error('Create Product Outer Error:', err);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

exports.updateProducto = async (req, res) => {
    console.log('Update Product Request Body:', req.body);
    console.log('Update Product Request File:', req.file);
    try {
        const { id } = req.params;
        const { nombre, categoria, precio, stock, stock_minimo, descripcion, tipo_inventario } = req.body;
        const imagen_url = req.file ? `/uploads/productos/${req.file.filename}` : null;

        if (!nombre) {
            return res.status(400).json({ 
                message: 'El nombre del producto es obligatorio para la actualización.',
                debugBody: req.body,
                debugFile: req.file ? 'Archivo recibido' : 'Sin archivo'
            });
        }

        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('nombre', sql.VarChar(100), nombre.toString().trim())
            .input('categoria', sql.VarChar(50), (categoria || 'bebidas').toString())
            .input('precio', sql.Decimal(10,2), parseFloat(precio) || 0)
            .input('stock', sql.Int, parseInt(stock) || 0)
            .input('stock_minimo', sql.Int, parseInt(stock_minimo) || 0)
            .input('descripcion', sql.VarChar(sql.MAX), descripcion || null)
            .input('tipo_inventario', sql.VarChar(50), tipo_inventario || 'venta')
            .input('imagen_url', sql.VarChar(sql.MAX), imagen_url || null)
            .input('usuario', sql.NVarChar, req.userName || 'Sistema')
            .query(`
                UPDATE productos 
                SET nombre=@nombre, 
                    categoria=@categoria, 
                    precio=@precio, 
                    stock=@stock, 
                    stock_minimo=@stock_minimo, 
                    descripcion=@descripcion, 
                    tipo_inventario=@tipo_inventario, 
                    imagen_url = ISNULL(@imagen_url, imagen_url),
                    UsuarioModificacion=@usuario, 
                    FechaModificacion=GETDATE() 
                WHERE id=@id
            `);
        
        res.json({ message: 'Producto actualizado con éxito' });
    } catch (err) {
        console.error('Update Product Error:', err);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

exports.toggleActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Obtener estado actual
        const current = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('SELECT activo FROM productos WHERE id = @id');

        if (current.recordset.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const nuevoEstado = (current.recordset[0].activo === true || current.recordset[0].activo === 1) ? 0 : 1;

        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('activo', sql.Bit, nuevoEstado)
            .query('UPDATE productos SET activo=@activo WHERE id=@id');

        res.json({ activo: nuevoEstado });
    } catch (err) {
        console.error('toggleActivo error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        // Verificar si tiene movimientos o ventas
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM inventario_movimientos WHERE producto_id = @id');
        
        if (result.recordset[0].count > 0) {
            return res.status(400).json({ message: 'No se puede eliminar un producto con movimientos de inventario.' });
        }

        await pool.request().input('id', sql.Int, id).query('DELETE FROM productos WHERE id=@id');
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
