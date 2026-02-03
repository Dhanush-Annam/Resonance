const User = require('../models/User');

exports.toggleLike = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const trackId = req.params.trackId;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.likedTracks.findIndex(
      id => id.toString() === trackId
    );

    let liked;

    if (index === -1) {
      user.likedTracks.push(trackId);
      liked = true;
    }
    else {
      user.likedTracks.splice(index, 1);
      liked = false;
    }

    await user.save();
    res.json({ liked });
    }
    catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
};

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
