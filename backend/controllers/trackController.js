const Track = require('../models/Track');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// ARTIST: Upload metadata
exports.createTrack = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { title, genre } = req.body;

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

// ARTIST: Fetch Tracks
exports.getMyTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ artist: req.user._id })
      .sort({ createdAt: -1 })

    res.json(tracks)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tracks' })
  }
}

//ARTIST: Upload audio
exports.uploadAudio = async (req, res) => {

  try {
    const track = await Track.findById(req.params.id)

    if (!track) {
      return res.status(404).json({ message: 'Track not found' })
    }

    // ownership check
    if (track.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // lock after approval
    if (track.status === 'approved') {
      return res
        .status(400)
        .json({ message: 'Approved tracks cannot be modified' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Audio file missing' })
    }

    const audioUrl = req.file.path || req.file.secure_url

    track.audioUrl = audioUrl
    await track.save()

    res.json({
      message: 'Audio uploaded successfully',
      audioUrl,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Audio upload failed' })
  }
}


//ARTIST: Upload cover image
exports.uploadCoverImage = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id)

    if (!track) {
      return res.status(404).json({ message: 'Track not found' })
    }

    // Ownership check
    if (track.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Lock after approval
    if (track.status === 'approved') {
      return res.status(400).json({
        message: 'Approved tracks cannot be modified'
      })
    }

    track.coverUrl = req.file.path
    await track.save()

    res.json({
      message: 'Cover uploaded successfully',
      coverUrl: track.coverUrl
    })
  } catch (error) {
    res.status(500).json({ message: 'Cover upload failed' })
  }
}

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

// PUBLIC: All approved tracks are visible
exports.getApprovedTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ status: 'approved' })
      .populate('artist', 'username')
      .select('title genre audioUrl coverUrl artist createdAt');

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tracks' });
  }
};

// PUBLIC: Get single approved track by ID
exports.getApprovedTrackById = async (req, res) => {
  try {
    const track = await Track.findOne({
      _id: req.params.id,
      status: 'approved'
    }).populate('artist', 'username');

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    res.json(track);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch track' });
  }
};

// PUBLIC: Search tracks
exports.searchTracks = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Find matching artists by username
    const matchingArtists = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('_id');

    const artistIds = matchingArtists.map(a => a._id);

    const searchQuery = {
      status: 'approved',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
        { artist: { $in: artistIds } }
      ]
    };

    // Fetch paginated results
    const tracks = await Track.find(searchQuery)
      .populate('artist', 'username')
      .select('title genre audioUrl coverUrl artist createdAt')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    // Total count
    const total = await Track.countDocuments(searchQuery);

    res.json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      results: tracks
    });
  } catch (error) {
    res.status(500).json({
      message: 'Search failed'
    });
  }
};
