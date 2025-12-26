const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'resonance/audio',
    resource_type: 'video',
    allowed_formats: ['mp3', 'wav', 'ogg']
  }
});

const uploadAudio = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files allowed'));
    }
    cb(null, true);
  }
});

module.exports = uploadAudio;
