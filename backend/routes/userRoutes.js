const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  likeTrack,
  unlikeTrack,
  getLikedTracks
} = require('../controllers/userController')

router.post('/likes/:trackId', protect, likeTrack)
router.delete('/likes/:trackId', protect, unlikeTrack)
router.get('/likes', protect, getLikedTracks)

module.exports = router
