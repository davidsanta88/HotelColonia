const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const reservasAbonosRouter = require('./reservasAbonos');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/cross-availability', reservasController.getCrossHotelAvailability);
router.get('/', reservasController.getReservas);
router.get('/:id', reservasController.getReservaById);
router.post('/', reservasController.createReserva);
router.put('/:id', reservasController.updateReserva);
router.patch('/:id/estado', reservasController.updateReservaStatus);
router.delete('/:id', reservasController.deleteReserva);

// Abonos sub-routes
router.use('/:id/abonos', reservasAbonosRouter);

module.exports = router;

