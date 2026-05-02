const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { verifyToken, isAdmin, isAdminOrSupervisor } = require('../middleware/auth');

router.get('/movimientos', verifyToken, inventarioController.getMovimientos);
router.post('/movimientos', [verifyToken, isAdminOrSupervisor], inventarioController.createMovimiento);
router.get('/alertas', verifyToken, inventarioController.getStockAlerts);

module.exports = router;
