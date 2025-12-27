const express = require('express')
const app = express()

const cors = require('cors')
const helmet = require('helmet')

const { protect, authorize } = require('./middleware/authMiddleware')
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter')

app.use(helmet())
app.use(express.json())

const allowedOrigins = [
  'http://localhost:5173',
  'https://resonance-liart.vercel.app'
]

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
)

// General API limiter
app.use('/api', apiLimiter)

// Auth-specific limiter
app.use('/api/auth', authLimiter)

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'))

// Track routes
app.use('/api/tracks', require('./routes/trackRoutes'))

// Admin routes
app.use(
  '/api/admin',
  protect,
  authorize('admin'),
  require('./routes/adminRoutes')
)

// Test routes
app.get('/api/profile', protect, (req, res) => {
  res.json({
    message: 'Access granted',
    user: req.user
  })
})

app.get('/api/admin-test', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Welcome admin' })
})

module.exports = app
