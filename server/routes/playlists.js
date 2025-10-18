const PlaylistController = require('../controllers/PlaylistController');
const router = require('express').Router();

router.post('/', PlaylistController.getSpotifySong); //! Buat data playlist baru berdasarkan isrc dan title lagu yang didapatkan dari audDD API
router.post('/create', PlaylistController.createUserPlaylist); //! Buat user playlist baru
router.get('/all', PlaylistController.getAllUserPlaylists); //! Ambil semua data playlist milik user yang sedang buka app
router.get('/:playlist_id', PlaylistController.getUserPlaylistById); //! Ambil 1 data playlist berdasarkan playlistId
router.delete('/:playlist_id', PlaylistController.deleteUserPlaylist); //! Hapus 1 data playlist berdasarkan playlistId
router.put('/:playlist_id', PlaylistController.updateUserPlaylist); //! Update 1 data playlist berdasarkan playlistId (push data lagu baru ke dalam playlist)




module.exports = router;
