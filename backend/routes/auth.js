const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, // Máximo 10 intentos de entrada por IP en 15 mins
    message: { message: "Demasiados intentos de inicio de sesión desde esta IP. Por favor, espere 15 minutos." }
});

router.post('/login', loginLimiter, authController.login);
router.get('/ping', (req, res) => res.json({ status: 'auth-ok', version: '1.0.3' }));
// router.post('/register', authController.register); // Missing in controller
router.post('/setup-admin', authController.setupInitialAdmin);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;

