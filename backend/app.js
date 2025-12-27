const express = require('express')
const app = express()

app.set('trust proxy', true)

const cors = require('cors')
const helmet = require('helmet')

const { protect, authorize } = require('./middleware/authMiddleware')

app.use(helmet())
app.use(express.json())

const allowedOrigins = [
  'http://localhost:5173',
  'https://resonance-liart.vercel.app'
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/tracks', require('./routes/trackRoutes'))

app.use(
  '/api/admin',
  protect,
  authorize('admin'),
  require('./routes/adminRoutes')
)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = app
