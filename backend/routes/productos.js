const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de productos (Memory Storage para Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', verifyToken, productosController.getProductos);
router.post('/', [verifyToken, isAdmin, upload.single('imagen')], productosController.createProducto);
router.put('/:id/imagen', [verifyToken, isAdmin, upload.single('imagen')], productosController.uploadImagen);
router.put('/:id', [verifyToken, isAdmin, upload.single('imagen')], productosController.updateProducto);

router.patch('/:id/activo', [verifyToken, isAdmin], productosController.toggleActivo);
router.delete('/:id', [verifyToken, isAdmin], productosController.deleteProducto);


module.exports = router;

