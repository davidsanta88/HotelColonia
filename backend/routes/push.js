const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pushController');

router.get('/vapid-public-key', ctrl.getVapidPublicKey);
router.post('/subscribe', ctrl.subscribe);
router.post('/unsubscribe', ctrl.unsubscribe);
router.post('/send-test', ctrl.sendTest);

module.exports = router;
