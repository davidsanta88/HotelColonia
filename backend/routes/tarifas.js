const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tarifaController');
const { verifyToken } = require('../middleware/auth');

router.get('/tipo-dia', verifyToken, ctrl.getTipoDiaActual);
router.get('/', verifyToken, ctrl.getTarifas);
router.get('/admin', verifyToken, ctrl.getAllTarifas);
router.post('/', verifyToken, ctrl.createTarifa);
router.put('/:id', verifyToken, ctrl.updateTarifa);
router.delete('/:id', verifyToken, ctrl.deleteTarifa);

module.exports = router;
