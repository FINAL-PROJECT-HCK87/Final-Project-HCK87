const PlaylistController = require('../controllers/PlaylistController');
const router = require('express').Router();

router.post('/', PlaylistController.getSpotifySong); //! Buat data playlist baru berdasarkan isrc dan title lagu yang didapatkan dari audDD API
router.post('/create', PlaylistController.createUserPlaylist); //! Buat user playlist baru
router.get('/all', PlaylistController.getAllUserPlaylists); //! Ambil semua data playlist milik user yang sedang buka app
router.get('/for-you', PlaylistController.searchPlaylists); //! Get playlists for you berdasarkan search history user + featured playlists

// Specific routes first (before generic :playlist_id routes)
router.post('/:playlist_id/share', PlaylistController.addDeviceToPlaylist); //! Share playlist dengan device lain
router.delete('/:playlist_id/leave', PlaylistController.removeDeviceFromPlaylist); //! Hapus device dari playlist (leave shared playlist)
router.delete('/:playlist_id/songs/:song_id', PlaylistController.removeSongFromPlaylist); //! Hapus lagu dari playlist (owner only)

// Generic routes last
router.get('/:playlist_id', PlaylistController.getUserPlaylistById); //! Ambil 1 data playlist berdasarkan playlistId
router.delete('/:playlist_id', PlaylistController.deleteUserPlaylist); //! Hapus 1 data playlist berdasarkan playlistId
router.put('/:playlist_id', PlaylistController.updateUserPlaylist); //! Update 1 data playlist berdasarkan playlistId (push data lagu baru ke dalam playlist)

module.exports = router;
