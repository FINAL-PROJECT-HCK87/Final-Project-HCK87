const PlaylistController = require('../controllers/PlaylistController');
const router = require('express').Router();

router.post('/', PlaylistController.getSpotifySong);




module.exports = router;
