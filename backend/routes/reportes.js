const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/ventas', verifyToken, isAdmin, reportesController.getReporteVentas);
router.get('/productos-mas-vendidos', verifyToken, isAdmin, reportesController.getProductosMasVendidos);
router.get('/resumen', verifyToken, isAdmin, reportesController.getResumenGeneral);
router.get('/gastos-periodo', verifyToken, isAdmin, reportesController.getGastosPorPeriodo);
router.get('/ingresos-manuales', verifyToken, isAdmin, reportesController.getIngresosManualesPorPeriodo);
router.get('/gastos-categoria', verifyToken, isAdmin, reportesController.getGastosPorCategoria);
router.get('/ventas-mensuales', verifyToken, isAdmin, reportesController.getVentasMensuales);
router.get('/ingresos-hospedaje', verifyToken, isAdmin, reportesController.getIngresosHospedaje);
router.get('/cuadre-caja', verifyToken, isAdmin, reportesController.getCuadreCaja);
router.get('/detalle-ingresos', verifyToken, isAdmin, reportesController.getDetalleIngresos);
router.get('/detalle-ingresos-consolidado', verifyToken, isAdmin, reportesController.getDetalleIngresosConsolidado);
router.get('/huespedes', verifyToken, isAdmin, reportesController.getReporteHuespedes);

module.exports = router;
