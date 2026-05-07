const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tarifaController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/tipo-dia', verifyToken, ctrl.getTipoDiaActual);
router.get('/', verifyToken, ctrl.getTarifas);
router.get('/admin', verifyToken, ctrl.getAllTarifas);
router.post('/', [verifyToken, isAdmin], ctrl.createTarifa);
router.put('/:id', [verifyToken, isAdmin], ctrl.updateTarifa);
router.delete('/:id', [verifyToken, isAdmin], ctrl.deleteTarifa);

module.exports = router;
