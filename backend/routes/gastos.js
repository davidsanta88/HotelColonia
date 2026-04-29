const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer (Memoria para Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.get('/', verifyToken, gastosController.getAllGastos);
router.get('/:id', verifyToken, gastosController.getGastoById);
router.post('/', [verifyToken, upload.single('imagen')], gastosController.createGasto);
router.put('/:id', [verifyToken, upload.single('imagen')], gastosController.updateGasto);
router.delete('/:id', [verifyToken, isAdmin], gastosController.deleteGasto);

module.exports = router;

