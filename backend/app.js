const express = require('express');
const app = express();
const { protect, authorize } = require('./middleware/authMiddleware');

app.use(express.json());

// ADMIN ROUTES
app.use(
  '/api/admin',
  protect,
  authorize('admin'),
  require('./routes/adminRoutes')
);

// AUTH ROUTES
app.use('/api/auth', require('./routes/authRoutes'));

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
