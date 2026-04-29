const express = require('express');
const router = express.Router();
const categoriasGastosController = require('../controllers/categoriasGastosController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas de categorías de gastos requieren estar autenticado,
// pero modificar/crear/eliminar requiere ser administrador.

router.get('/', verifyToken, categoriasGastosController.getAllCategorias);
router.post('/', [verifyToken, isAdmin], categoriasGastosController.createCategoria);
router.put('/:id', [verifyToken, isAdmin], categoriasGastosController.updateCategoria);
router.put('/:id/toggle', [verifyToken, isAdmin], categoriasGastosController.toggleCategoriaActivo);
router.delete('/:id', [verifyToken, isAdmin], categoriasGastosController.deleteCategoria);

module.exports = router;

