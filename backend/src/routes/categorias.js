const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Obtener todas las categorías (cualquier usuario autenticado puede verlas para crear productos y para la tienda)
router.get('/', verifyToken, categoriasController.getAllCategorias);

// Crear, actualizar y eliminar sólo para administradores
router.post('/', [verifyToken, isAdmin], categoriasController.createCategoria);
router.put('/:id', [verifyToken, isAdmin], categoriasController.updateCategoria);
router.patch('/:id/activo', [verifyToken, isAdmin], categoriasController.toggleCategoriaActivo);
router.delete('/:id', [verifyToken, isAdmin], categoriasController.deleteCategoria);

module.exports = router;

