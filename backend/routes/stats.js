const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Ruta para obtener estadísticas comparativas entre hoteles
// Se protege con auth para que solo administradores puedan verla
router.get('/comparative', auth, statsController.getComparativeStats);

module.exports = router;
