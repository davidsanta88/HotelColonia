const express = require('express');
const router = express.Router();
const mediosPagoController = require('../controllers/mediosPagoController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, mediosPagoController.getMediosPago);
router.post('/', [verifyToken, isAdmin], mediosPagoController.createMedioPago);
router.put('/:id', [verifyToken, isAdmin], mediosPagoController.updateMedioPago);
router.delete('/:id', [verifyToken, isAdmin], mediosPagoController.deleteMedioPago);

module.exports = router;
