const express = require('express');
const router = express.Router();

const { body } = require('express-validator');
router.post(
  '/',
  protect,
  authorize('artist'),
  [
    body('title').trim().notEmpty(),
    body('genre').trim().notEmpty()
  ],
  createTrack
);

const {
  createTrack,
  getPendingTracks,
  approveTrack,
  rejectTrack,
  getApprovedTracks,
  getApprovedTrackById
} = require('../controllers/trackController');

const { protect, authorize } = require('../middleware/authMiddleware');

const uploadAudio = require('../middleware/uploadMiddleware');
const { uploadAudio: uploadAudioController } = require('../controllers/trackController');

// PUBLIC ROUTES
router.get('/public', getApprovedTracks);
router.get('/public/:id', getApprovedTrackById);


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
