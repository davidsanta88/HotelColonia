const express = require('express');
const router = express.Router();
const cierreCajaController = require('../controllers/cierreCajaController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, cierreCajaController.createCierre);
router.get('/', verifyToken, cierreCajaController.getAllCierres);

module.exports = router;
