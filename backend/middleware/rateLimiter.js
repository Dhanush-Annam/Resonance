const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req , res) => {
    return rateLimit.ipKeyGenerator(req , res)
  }
})

module.exports = { apiLimiter }
