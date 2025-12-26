const express = require('express');
const router = express.Router();
const {
  createTrack,
  getPendingTracks,
  approveTrack,
  rejectTrack
} = require('../controllers/trackController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ARTIST
router.post('/', protect, authorize('artist'), createTrack);

// ADMIN
router.get('/pending', protect, authorize('admin'), getPendingTracks);
router.put('/:id/approve', protect, authorize('admin'), approveTrack);
router.put('/:id/reject', protect, authorize('admin'), rejectTrack);

module.exports = router;
