const router = require('express').Router();
const song = require('./songs');
const user = require('./users');
const playlist = require('./playlists');


router.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Melodix API' });
});
router.use('/songs', song);
router.use('/users', user);
router.use('/playlists', playlist);

module.exports = router;
