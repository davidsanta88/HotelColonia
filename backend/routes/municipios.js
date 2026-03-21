const express = require('express');
const router = express.Router();
const municipiosController = require('../controllers/municipiosController');
const { verifyToken, checkPermission } = require('../middleware/auth');

router.get('/', verifyToken, municipiosController.getMunicipios);
router.post('/', [verifyToken, checkPermission('municipios', 'can_edit')], municipiosController.createMunicipio);
router.put('/:id', [verifyToken, checkPermission('municipios', 'can_edit')], municipiosController.updateMunicipio);
router.delete('/:id', [verifyToken, checkPermission('municipios', 'can_delete')], municipiosController.deleteMunicipio);

module.exports = router;
