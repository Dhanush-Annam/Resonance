const Track = require('../models/Track');

// ARTIST: Upload metadata
exports.createTrack = async (req, res) => {
  try {
    const { title, genre } = req.body;

    if (!title || !genre) {
      return res.status(400).json({ message: 'Title and genre are required' });
    }

    const track = await Track.create({
      title,
      genre,
      artist: req.user._id
    });

    res.status(201).json({
      message: 'Track submitted for approval',
      track
    });
  } catch (error) {
    res.status(500).json({ message: 'Track upload failed' });
  }
};

//ARTIST: Upload audio
exports.uploadAudio = async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  if (track.status === 'approved') {
  return res.status(400).json({
    message: 'Approved tracks cannot be modified'
  });
}


  if (track.artist.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'Audio file is required' });
  }

  track.audioUrl = req.file.path;
  await track.save();

  res.json({
    message: 'Audio uploaded successfully',
    audioUrl: track.audioUrl
  });
};


// ADMIN: View pending tracks
exports.getPendingTracks = async (req, res) => {
  const tracks = await Track.find({ status: 'pending' }).populate(
    'artist',
    'username email'
  );
  res.json(tracks);
};

// ADMIN: Approve track
exports.approveTrack = async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  track.status = 'approved';
  track.rejectionReason = null;
  await track.save();

  res.json({ message: 'Track approved' });
};

// ADMIN: Reject track
exports.rejectTrack = async (req, res) => {
  const { reason } = req.body;
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({ message: 'Track not found' });
  }

  track.status = 'rejected';
  track.rejectionReason = reason || 'Not specified';
  await track.save();

  res.json({ message: 'Track rejected' });
};
