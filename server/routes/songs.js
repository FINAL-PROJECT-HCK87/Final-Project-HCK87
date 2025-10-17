const Controller = require('../controllers/Controller');
const upload = require('../middleware/upload');
const router = require('express').Router();

router.get('/', Controller.findAll);
router.post('/', Controller.findOrCreateSong); //simpan searched song ke db
router.post('/recognize', upload.single('audio'), Controller.recognizeSong); // NEW: Shazam recognition endpoint

// Spotify Test Endpoints
router.get('/test/spotify-token', Controller.testSpotifyToken);
router.get('/test/spotify-artist', Controller.testSpotifyArtist);
router.get('/test/spotify-track', Controller.testSpotifyTrack);

module.exports = router;
