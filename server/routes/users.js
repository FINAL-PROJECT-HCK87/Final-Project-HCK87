const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');

const router = require('express').Router();

router.post('/', UserController.postUser);
router.post('/search-history', authenticate, UserController.addToSearchHistory);
router.get('/search-history', authenticate, UserController.getSearchHistory);
router.get('/artists-from-history', authenticate, UserController.getArtistsFromHistory);
router.delete('/search-history/:song_id', authenticate, UserController.deleteHistoryItem);
router.delete('/search-history', authenticate, UserController.clearAllHistory);

module.exports = router;
