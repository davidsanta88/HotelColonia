const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const { verifyToken, authorize } = require('../middleware/auth');

router.use(verifyToken);
// Protegemos el router para que el código frontend "reservas" esté verificado desde la app
// Aunque las validaciones fuertes se hacen principalmente del lado FrontEnd + Token Auth, 
// acá confirmamos la sesión por verifyToken.

router.get('/', reservasController.getAllReservas);
router.post('/', reservasController.createReserva);
router.put('/:id', reservasController.updateReserva);
router.patch('/:id/estado', reservasController.updateReservaStatus);

module.exports = router;
