const express = require('express');
const app = express();
const { protect, authorize } = require('./middleware/authMiddleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet');
app.use(helmet());
app.use(express.json());

// API LIMITER
app.use('/api', apiLimiter);

// AUTHENTICATION LIMITER
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

// ADMIN ROUTES
app.use(
  '/api/admin',
  protect,
  authorize('admin'),
  require('./routes/adminRoutes')
);

// AUTH ROUTES
app.use('/api/auth', require('./routes/authRoutes'));

// TRACK ROUTES
app.use('/api/tracks', require('./routes/trackRoutes'));

app.get('/api/profile', protect, (req, res) => {
  res.json({
    message: 'Access granted',
    user: req.user
  });
});

app.get('/api/admin', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Welcome admin' });
});

module.exports = app;
