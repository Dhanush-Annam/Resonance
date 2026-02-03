const User = require('../models/User');

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user._id
    const trackId = req.params.trackId

    const user = await User.findOne({
      _id: userId,
      likedTracks: trackId,
    })

    let liked

    if (user) {
      await User.findByIdAndUpdate(userId, {
        $pull: { likedTracks: trackId },
      })
      liked = false
    }
    else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedTracks: trackId },
      })
      liked = true
    }

    res.json({ liked })
  }
  catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to toggle like' })
  }
}

exports.getLikedSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('likedTracks');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.likedTracks);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch liked songs' });
  }
};
