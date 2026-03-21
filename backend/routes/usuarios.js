const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Absolutamente todas las rutas de este módulo son sensitivas: requieren Admin.
router.use(verifyToken, isAdmin);

router.get('/', usuariosController.getAllUsuarios);
router.post('/', usuariosController.createUsuario);
router.put('/:id', usuariosController.updateUsuario);
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
