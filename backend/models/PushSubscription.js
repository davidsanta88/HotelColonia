const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: String,
        auth: String
    },
    hotel: String,
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
