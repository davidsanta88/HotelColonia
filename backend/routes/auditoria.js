const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Solo administradores
router.get('/logs', verifyToken, isAdmin, auditoriaController.getLogs);

module.exports = router;
