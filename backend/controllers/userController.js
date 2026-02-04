const User = require('../models/User')

exports.likeTrack = async (req, res) => {
  const { trackId } = req.params

  await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { likedTracks: trackId } },
    { new: true }
  )

  res.json({ message: 'Track liked' })
}

exports.unlikeTrack = async (req, res) => {
  const { trackId } = req.params

  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { likedTracks: trackId } }
  )

  res.json({ message: 'Track unliked' })
}

exports.getLikedTracks = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('likedTracks')

  res.json(user.likedTracks)
}
