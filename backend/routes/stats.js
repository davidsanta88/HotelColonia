const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken } = require('../middleware/auth');

// Ruta para obtener estadísticas comparativas entre hoteles
// Se protege con verifyToken para que solo usuarios autenticados puedan verla
router.get('/comparative', verifyToken, statsController.getComparativeStats);
router.get('/consolidated-reservations', verifyToken, statsController.getConsolidatedReservations);

module.exports = router;
