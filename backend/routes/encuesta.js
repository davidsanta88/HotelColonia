const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/encuestaController');
const { verifyToken } = require('../middleware/auth');

// Públicas (sin token)
router.get('/responder/:token', ctrl.getEncuestaByToken);
router.post('/responder/:token', ctrl.responderEncuesta);

// Protegidas
router.post('/', verifyToken, ctrl.crearEncuesta);
router.post('/desde-registro/:registroId', verifyToken, ctrl.crearDesdeRegistro);
router.get('/', verifyToken, ctrl.getEncuestas);
router.delete('/:id', verifyToken, ctrl.deleteEncuesta);

module.exports = router;
