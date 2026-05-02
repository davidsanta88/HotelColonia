const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { verifyToken, isAdmin, isAdminOrSupervisor } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de productos (Memory Storage para Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', verifyToken, productosController.getProductos);
router.post('/', [verifyToken, isAdminOrSupervisor, upload.single('imagen')], productosController.createProducto);
router.put('/:id/imagen', [verifyToken, isAdminOrSupervisor, upload.single('imagen')], productosController.uploadImagen);
router.put('/:id', [verifyToken, isAdminOrSupervisor, upload.single('imagen')], productosController.updateProducto);

router.patch('/:id/activo', [verifyToken, isAdminOrSupervisor], productosController.toggleActivo);
router.delete('/:id', [verifyToken, isAdminOrSupervisor], productosController.deleteProducto);


module.exports = router;
