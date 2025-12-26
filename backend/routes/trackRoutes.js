const express = require('express');
const router = express.Router();

const {
  createTrack,
  getPendingTracks,
  approveTrack,
  rejectTrack
} = require('../controllers/trackController');

const { protect, authorize } = require('../middleware/authMiddleware');

const uploadAudio = require('../middleware/uploadMiddleware');
const { uploadAudio: uploadAudioController } = require('../controllers/trackController');

// ARTIST
router.post('/', protect, authorize('artist'), createTrack);
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
