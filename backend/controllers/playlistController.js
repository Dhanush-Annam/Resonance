const Playlist = require("../models/Playlist");
const Track = require("../models/Track");

exports.createPlaylist = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({
      owner: req.user._id,
      name,
      tracks: [],
    });

    res.status(201).json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create playlist" });
  }
}

exports.getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .select("name tracks createdAt updatedAt");

    res.json(
      playlists.map((p) => ({
        _id: p._id,
        name: p.name,
        trackCount: Array.isArray(p.tracks) ? p.tracks.length : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch playlists" });
  }
}

exports.getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).populate({
      path: "tracks",
      populate: {
        path: "artist",
        select: "username",
      },
      select: "title genre audioUrl coverUrl artist createdAt",
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch playlist" });
  }
}

exports.addTrackToPlaylist = async (req, res) => {
  try {
    const trackId = req.body?.trackId;

    if (!trackId) {
      return res.status(400).json({ message: "trackId is required" });
    }

    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const track = await Track.findOne({ _id: trackId, status: "approved" });
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    const alreadyInPlaylist = playlist.tracks.some(
      (t) => t.toString() === trackId.toString(),
    );

    if (!alreadyInPlaylist) {
      playlist.tracks.push(trackId);
      await playlist.save();
    }

    res.json({ message: "Track added", added: !alreadyInPlaylist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add track" });
  }
}

exports.removeTrackFromPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const trackId = req.params.trackId;

    const before = playlist.tracks.length;
    playlist.tracks = playlist.tracks.filter(
      (t) => t.toString() !== trackId.toString(),
    );

    const removed = playlist.tracks.length !== before;
    if (removed) {
      await playlist.save();
    }

    res.json({ message: "Track removed", removed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove track" });
  }
}

exports.deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    await playlist.deleteOne();

    res.json({ message: "Playlist deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete playlist" });
  }
};