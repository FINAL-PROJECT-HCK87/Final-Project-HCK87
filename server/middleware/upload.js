const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (no disk I/O)
const storage = multer.memoryStorage();

// File filter - accept audio files only
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/aac',
    'video/mp4',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
