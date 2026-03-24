const express = require('express');
const router = express.Router();
const estadosHabitacionController = require('../controllers/estadosHabitacionController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.use(verifyToken);

router.route('/')
    .get(estadosHabitacionController.getEstadosHabitacion)
    .post(isAdmin, estadosHabitacionController.createEstadoHabitacion);

router.route('/:id')
    .put(isAdmin, estadosHabitacionController.updateEstadoHabitacion)
    .delete(isAdmin, estadosHabitacionController.deleteEstadoHabitacion);

module.exports = router;
