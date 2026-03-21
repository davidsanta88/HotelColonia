const express = require('express');
const router = express.Router();
const tiposHabitacionController = require('../controllers/tiposHabitacionController');
const auth = require('../middleware/auth');
const verifyToken = auth.verifyToken;
const isAdmin = auth.isAdmin;

router.use(verifyToken); // Todas las rutas requieren autenticación

// Configurar tipos de habitación solo para administradores
router.route('/')
    .get(tiposHabitacionController.getTiposHabitacion)
    .post(isAdmin, tiposHabitacionController.createTipoHabitacion);

router.route('/:id')
    .put(isAdmin, tiposHabitacionController.updateTipoHabitacion)
    .delete(isAdmin, tiposHabitacionController.deleteTipoHabitacion);

module.exports = router;
