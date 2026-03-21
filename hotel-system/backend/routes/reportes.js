const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/ventas', verifyToken, isAdmin, reportesController.getReporteVentas);
router.get('/productos-mas-vendidos', verifyToken, isAdmin, reportesController.getProductosMasVendidos);
router.get('/resumen', verifyToken, isAdmin, reportesController.getResumenGeneral);

module.exports = router;
