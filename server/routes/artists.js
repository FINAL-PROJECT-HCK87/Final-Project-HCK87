const Controller = require('../controllers/Controller');
const router = require('express').Router();

// Duplicate check endpoint for artists

router.get('/:id/concerts', Controller.getArtistConcerts); // Get upcoming concerts from Bandsintown API

module.exports = router;
