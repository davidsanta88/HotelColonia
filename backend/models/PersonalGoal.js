const mongoose = require('mongoose');

const personalGoalSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    montoObjetivo: {
        type: Number,
        required: true,
        min: 0
    },
    montoActual: {
        type: Number,
        default: 0,
        min: 0
    },
    fechaLimite: {
        type: Date
    },
    color: {
        type: String,
        default: '#10b981'
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, {
    timestamps: true,
    collection: 'personal_goals'
});

module.exports = mongoose.model('PersonalGoal', personalGoalSchema);
