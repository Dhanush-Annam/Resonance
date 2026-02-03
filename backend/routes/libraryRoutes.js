const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleLike , getLikedSongs} = require('../controllers/libraryController');

router.post('/likes/:trackId', protect, toggleLike);
router.get('/likes', protect, getLikedSongs);
module.exports = router;
