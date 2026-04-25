const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Absolutamente todas las rutas de este módulo son sensitivas: requieren Admin.
router.get('/', verifyToken, usuariosController.getAllUsuarios);
router.post('/', [verifyToken, isAdmin], usuariosController.createUsuario);
router.put('/:id', [verifyToken, isAdmin], usuariosController.updateUsuario);
router.delete('/:id', [verifyToken, isAdmin], usuariosController.deleteUsuario);

module.exports = router;
