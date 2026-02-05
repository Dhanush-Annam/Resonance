const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

router.post("/", protect, createPlaylist);
router.get("/", protect, getMyPlaylists);
router.get("/:id", protect, getPlaylistById);
router.delete("/:id", protect, deletePlaylist);

router.post("/:id/tracks", protect, addTrackToPlaylist);
router.delete("/:id/tracks/:trackId", protect, removeTrackFromPlaylist);

module.exports = router;