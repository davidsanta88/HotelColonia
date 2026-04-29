const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/analytics/track
 * @desc    Registra una visita desde el frontend público
 * @access  Public
 */
router.post('/track', analyticsController.trackVisit);

/**
 * @route   GET /api/analytics/stats
 * @desc    Obtiene estadísticas agregadas para el dashboard
 * @access  Protected (Admin/Hotel Manager)
 */
router.get('/stats', verifyToken, analyticsController.getStats);

module.exports = router;

