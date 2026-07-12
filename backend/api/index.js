const app = require('../app');
const connectDB = require('../config/db');

// Connect to MongoDB
connectDB().catch(err => {
  console.error("Database connection error during function initialization:", err);
});

module.exports = app;
