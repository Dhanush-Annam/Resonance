const express = require('express')
const app = express()

app.set('trust proxy', 1)

const cors = require('cors')
const helmet = require('helmet')

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://resonance-liart.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.options('/*', cors())

app.use(helmet())
app.use(express.json())

const { apiLimiter } = require('./middleware/rateLimiter')
app.use('/api', apiLimiter)

const { protect, authorize } = require('./middleware/authMiddleware')

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/tracks', require('./routes/trackRoutes'))

app.use(
  '/api/admin',
  protect,
  authorize('admin'),
  require('./routes/adminRoutes')
)
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/users', require('./routes/userRoutes'))

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = app
