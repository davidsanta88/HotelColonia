const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/turnoController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, ctrl.getTurnos);
router.post('/', verifyToken, ctrl.createTurno);
router.put('/:id', verifyToken, ctrl.updateTurno);
router.delete('/:id', [verifyToken, isAdmin], ctrl.deleteTurno);

module.exports = router;
