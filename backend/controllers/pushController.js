const PushSubscription = require('../models/PushSubscription');
const webPush = require('web-push');

const getVapidKeys = () => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (pub && priv) return { publicKey: pub, privateKey: priv };
    return null;
};

exports.getVapidPublicKey = (req, res) => {
    const keys = getVapidKeys();
    if (!keys) return res.status(503).json({ message: 'Push no configurado. Agregue VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY al .env' });
    res.json({ publicKey: keys.publicKey });
};

exports.subscribe = async (req, res) => {
    try {
        const { subscription, hotel } = req.body;
        const usuario_id = req.user?.id;
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            { endpoint: subscription.endpoint, keys: subscription.keys, usuario_id, hotel },
            { upsert: true, new: true }
        );
        res.json({ message: 'Suscripción guardada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
        res.json({ message: 'Suscripción eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.sendNotification = async (payload) => {
    const keys = getVapidKeys();
    if (!keys) return;
    webPush.setVapidDetails('mailto:admin@hotel.com', keys.publicKey, keys.privateKey);
    const subscriptions = await PushSubscription.find();
    for (const sub of subscriptions) {
        try {
            await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
        } catch (e) {
            if (e.statusCode === 410) await PushSubscription.deleteOne({ _id: sub._id });
        }
    }
};

exports.sendTest = async (req, res) => {
    try {
        await exports.sendNotification({ title: 'Hotel System', body: req.body.message || 'Notificación de prueba', icon: '/logo.jpg' });
        res.json({ message: 'Notificación enviada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
