const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/gastos';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', verifyToken, gastosController.getAllGastos);
router.post('/', [verifyToken, upload.single('imagen')], gastosController.createGasto);
router.put('/:id', [verifyToken, upload.single('imagen')], gastosController.updateGasto);
router.delete('/:id', [verifyToken, isAdmin], gastosController.deleteGasto);

module.exports = router;
