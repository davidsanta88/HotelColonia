const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, clientesController.getClientes);
router.post('/', verifyToken, clientesController.createCliente);
router.put('/:id', verifyToken, clientesController.updateCliente);
router.delete('/:id', verifyToken, clientesController.deleteCliente);

module.exports = router;

