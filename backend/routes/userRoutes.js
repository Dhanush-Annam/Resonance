const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  likeTrack,
  unlikeTrack,
  getLikedTracks,
  addRecentlyPlayed,
  getRecentlyPlayed,
} = require("../controllers/userController");

router.post("/likes/:trackId", protect, likeTrack);
router.delete("/likes/:trackId", protect, unlikeTrack);
router.get("/likes", protect, getLikedTracks);

router.post("/recent/:trackId", protect, addRecentlyPlayed);
router.get("/recent", protect, getRecentlyPlayed);

module.exports = router;
