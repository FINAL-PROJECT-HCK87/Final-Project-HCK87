const Controller = require('../controllers/Controller');
const upload = require('../middleware/upload');
const router = require('express').Router();

router.get('/top/popular', Controller.getTopSongs); // Get top 4 most searched songs
router.get('/:id', Controller.songById); //get song by id
router.post('/', Controller.findOrCreateSong); //simpan searched song ke db
router.post('/recognize', upload.single('audio'), Controller.recognizeSong); // NEW: Shazam recognition endpoint

// Spotify Test Endpoints
module.exports = router;
