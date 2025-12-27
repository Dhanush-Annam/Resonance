const express = require('express')
const app = express()

app.set('trust proxy', true)

const cors = require('cors')
const helmet = require('helmet')

const { protect, authorize } = require('./middleware/authMiddleware')

app.use(helmet())
app.use(express.json())

app.use(cors({
  origin: true,
  credentials: true
}))

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
