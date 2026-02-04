const User = require("../models/User");

exports.likeTrack = async (req, res) => {
  const { trackId } = req.params;

  await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { likedTracks: trackId } },
    { new: true },
  );

  res.json({ message: "Track liked" });
};

exports.unlikeTrack = async (req, res) => {
  const { trackId } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { likedTracks: trackId },
  });

  res.json({ message: "Track unliked" });
};

exports.getLikedTracks = async (req, res) => {
  const user = await User.findById(req.user._id).populate("likedTracks");

  res.json(user.likedTracks);
};

exports.addRecentlyPlayed = async (req, res) => {
  const { trackId } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { recentlyPlayed: { track: trackId } },
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        recentlyPlayed: {
          $each: [{ track: trackId }],
          $position: 0,
          $slice: 20,
        },
      },
    },
    { new: true },
  ).populate({
    path: "recentlyPlayed.track",
    populate: {
      path: "artist",
      select: "username",
    },
  });

  res.json(user.recentlyPlayed);
};

exports.getRecentlyPlayed = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "recentlyPlayed.track",
    populate: {
      path: "artist",
      select: "username",
    },
  });

  res.json(user.recentlyPlayed);
};
