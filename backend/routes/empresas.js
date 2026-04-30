const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, empresasController.getEmpresas);
router.get('/:id', verifyToken, empresasController.getEmpresaById);
router.post('/', verifyToken, empresasController.createEmpresa);
router.put('/:id', verifyToken, empresasController.updateEmpresa);
router.delete('/:id', verifyToken, empresasController.deleteEmpresa);

module.exports = router;
