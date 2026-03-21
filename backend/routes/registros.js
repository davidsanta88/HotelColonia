const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, registrosController.getRegistros);
router.get('/activos', verifyToken, registrosController.getActiveRegistros);
router.get('/:id', verifyToken, registrosController.getRegistroById);
router.post('/', verifyToken, registrosController.createRegistro);
router.put('/:id', verifyToken, registrosController.updateRegistro);

module.exports = router;
