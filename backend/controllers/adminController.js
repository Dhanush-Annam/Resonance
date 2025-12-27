const Track = require('../models/Track')

// Admin create track
exports.adminCreateTrack = async (req, res) => {
  const { title, genre } = req.body

  if (!title || !genre) {
    return res.status(400).json({ message: 'Title and genre required' })
  }

  const track = await Track.create({
    title,
    genre,
    artist: req.user._id,
    status: 'approved'
  })

  res.status(201).json(track)
}

// Admin upload audio
exports.adminUploadAudio = async (req, res) => {
  const track = await Track.findById(req.params.id)
  if (!track) return res.status(404).json({ message: 'Track not found' })

  track.audioUrl = req.file.path || req.file.secure_url
  await track.save()

  res.json({ message: 'Audio uploaded', audioUrl: track.audioUrl })
}

// Admin upload cover
exports.adminUploadCover = async (req, res) => {
  const track = await Track.findById(req.params.id)
  if (!track) return res.status(404).json({ message: 'Track not found' })

  track.coverUrl = req.file.path || req.file.secure_url
  await track.save()

  res.json({ message: 'Cover uploaded', coverUrl: track.coverUrl })
}
