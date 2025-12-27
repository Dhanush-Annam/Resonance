const express = require('express')
const router = express.Router()

const { protect, authorize } = require('../middleware/authMiddleware')
const { uploadAudio, uploadCover } = require('../middleware/uploadMiddleware')
const {
  adminCreateTrack,
  adminUploadAudio,
  adminUploadCover
} = require('../controllers/adminController')

router.post(
  '/tracks',
  protect,
  authorize('admin'),
  adminCreateTrack
)

router.post(
  '/tracks/:id/audio',
  protect,
  authorize('admin'),
  uploadAudio.single('audio'),
  adminUploadAudio
)

router.post(
  '/tracks/:id/cover',
  protect,
  authorize('admin'),
  uploadCover.single('cover'),
  adminUploadCover
)

module.exports = router
