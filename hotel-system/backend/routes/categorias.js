const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { verifyToken, isAdmin, authorize } = require('../middleware/auth');

// GET all categories - Accessible by any authenticated user (e.g. for creating products)
router.get('/', verifyToken, categoriasController.getAllCategorias);

// POST create a category - Admin only
router.post('/', verifyToken, isAdmin, categoriasController.createCategoria);

// PUT update a category - Admin only
router.put('/:id', verifyToken, isAdmin, categoriasController.updateCategoria);

// PUT toggle active status - Admin only
router.put('/:id/toggle', verifyToken, isAdmin, categoriasController.toggleCategoriaActivo);

// DELETE a category - Admin only
router.delete('/:id', verifyToken, isAdmin, categoriasController.deleteCategoria);

module.exports = router;
