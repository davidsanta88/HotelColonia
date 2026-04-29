const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');

// Helper para subir buffer a Cloudinary
const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'productos' },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

exports.getProductos = async (req, res) => {
    try {
        const productos = await Producto.find().sort({ nombre: 1 });
        res.json(productos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProducto = async (req, res) => {
    try {
        const { nombre, categoria, precio, precio_compra, margen, stock, stock_minimo, descripcion, tipo_inventario } = req.body;

        let imagen_url = null;
        if (req.file) {
            const result = await streamUpload(req.file.buffer);
            imagen_url = result.secure_url;
            console.log(`[CLOUDINARY] Product image uploaded: ${imagen_url}`);
        }

        const newProd = new Producto({
            nombre: nombre.trim(),
            categoria,
            precio_compra: parseFloat(precio_compra) || 0,
            precio: parseFloat(precio) || 0,
            margen: parseFloat(margen) || 0,
            stock: parseInt(stock) || 0,
            stockMinimo: parseInt(stock_minimo) || 0,
            descripcion,
            tipoInventario: tipo_inventario || 'venta',
            imagenUrl: imagen_url,
            usuarioCreacion: req.userName
        });

        await newProd.save();
        res.status(201).json({ message: 'Producto creado con éxito', producto: newProd });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, precio, precio_compra, margen, stock, stock_minimo, descripcion, tipo_inventario } = req.body;

        const updateData = {
            nombre: nombre.trim(),
            categoria,
            precio_compra: parseFloat(precio_compra) || 0,
            precio: parseFloat(precio) || 0,
            margen: parseFloat(margen) || 0,
            stock: parseInt(stock) || 0,
            stockMinimo: parseInt(stock_minimo) || 0,
            descripcion,
            tipoInventario: tipo_inventario || 'venta',
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        };

        if (req.file) {
            const result = await streamUpload(req.file.buffer);
            updateData.imagenUrl = result.secure_url;
            console.log(`[CLOUDINARY] Product image updated: ${updateData.imagenUrl}`);
        }

        const updated = await Producto.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ message: 'Producto actualizado con éxito', producto: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Producto.findById(id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

        product.activo = !product.activo;
        await product.save();
        res.json({ activo: product.activo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        await Producto.findByIdAndDelete(id);
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductoDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findById(id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAlertasStock = async (req, res) => {
    try {
        const products = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        const updated = await Producto.findByIdAndUpdate(id, { stock }, { new: true });
        res.json({ message: 'Stock actualizado', stock: updated.stock });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.uploadImagen = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }

        const result = await streamUpload(req.file.buffer);
        const product = await Producto.findByIdAndUpdate(id, { 
            imagenUrl: result.secure_url,
            usuarioModificacion: req.userName,
            fechaModificacion: Date.now()
        }, { new: true });

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        console.log(`[CLOUDINARY] Manual image upload success: ${result.secure_url}`);
        res.json({ message: 'Imagen subida con éxito', producto: product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

