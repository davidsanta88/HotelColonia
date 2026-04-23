const express = require('express');
const router = express.Router();
const hotelConfigController = require('../controllers/hotelConfigController');
const { verifyToken } = require('../middleware/auth');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Todas las rutas de configuración requieren token
router.get('/', hotelConfigController.getConfig);
router.put('/', hotelConfigController.updateConfig);
router.post('/upload-firma', [verifyToken, upload.single('firma')], hotelConfigController.uploadFirma);

module.exports = router;
