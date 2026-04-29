const mongoose = require('mongoose');
require('dotenv').config();

// Global configuration for Mongoose to include 'id' in JSON and Objects
mongoose.set('toJSON', { virtuals: true });
mongoose.set('toObject', { virtuals: true });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;


