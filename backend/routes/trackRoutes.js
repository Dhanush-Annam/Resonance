const express = require('express');
const router = express.Router();

const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadAudio, uploadCover } = require('../middleware/uploadMiddleware');

const {
  createTrack,
  getPendingTracks,
  approveTrack,
  rejectTrack,
  getApprovedTracks,
  getApprovedTrackById,
  uploadAudio: uploadAudioController,
  searchTracks,
  getMyTracks,
  uploadCoverImage
} = require('../controllers/trackController');

router.post(
  '/',
  protect,
  authorize('artist', 'admin'),
  [
    body('title').trim().notEmpty(),
    body('genre').trim().notEmpty()
  ],
  createTrack
);

// PUBLIC ROUTES
router.get('/public', getApprovedTracks);
router.get('/public/:id', getApprovedTrackById);
router.get('/search', searchTracks);

// ARTIST
router.post('/', protect, authorize('artist'), createTrack);
router.get(
  '/my',
  protect,
  authorize('artist'),
  getMyTracks
)
router.post(
  '/:id/cover',
  protect,
  authorize('artist'),
  uploadCover.single('cover'),
  uploadCoverImage
)
router.post(
  '/:id/audio',
  protect,
  authorize('artist'),
  uploadAudio.single('audio'),
  uploadAudioController
);

// ADMIN
router.get('/pending', protect, authorize('admin'), getPendingTracks);
router.put('/:id/approve', protect, authorize('admin'), approveTrack);
router.put('/:id/reject', protect, authorize('admin'), rejectTrack);

module.exports = router;
