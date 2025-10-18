const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const Controller = require('./Controller');

class UserController {
  static getCollection() {
    const db = getDB();
    const collection = db.collection('users');
    return collection;
  }

  static async postUser(req, res, next) {
    try {
      const { device_id } = req.body;
      const collection = UserController.getCollection();
      const data = await collection.findOne({ device_id: req.body.device_id });
      if (!data) {
        const newUser = {
          device_id,
          is_anonymous: true,
          search_history: [],
          created_at: new Date(),
          updated_at: new Date(),
        };
        const result = await collection.insertOne(newUser);
        const insertedUser = { _id: result.insertedId, ...newUser };
        return res.status(201).json({ user_id: insertedUser._id.toString(), ...insertedUser });
      }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async addToSearchHistory(req, res, next) {
    try {
      const { song_id } = req.body;
      if (!song_id) {
        return res.status(400).json({ message: 'song_id is required' });
      }
      const collectionSong = await Controller.getCollection();
      const songData = await collectionSong.findOne({ _id: new ObjectId(song_id) });
      if (!songData) {
        return res.status(404).json({ message: 'Song not found' });
      }
      const user_id = req.user._id;
      const collection = UserController.getCollection();
      const data = await collection.findOne({ _id: user_id });
      if (data) {
        const updatedSearchHistory = data.search_history || [];
        if (updatedSearchHistory.includes(song_id)) {
          return res.status(200).json({ message: 'Song already in search history' });
        }
        updatedSearchHistory.push(song_id);
        await collection.updateOne(
          { _id: user_id },
          { $set: { search_history: updatedSearchHistory } }
        );
        return res.status(200).json({ message: 'Search history updated' });
      }
      return res.status(404).json({ message: 'User not found' });
    } catch (error) {
      next(error);
    }
  }

  static async getSearchHistory(req, res, next) {
    try {
      const user_id = req.user._id;
      const collection = UserController.getCollection();
      const user = await collection.findOne({ _id: user_id });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const collectionSong = Controller.getCollection();
      const songIds = user.search_history.map((id) => new ObjectId(id));
      const songs = await collectionSong.find({ _id: { $in: songIds } }).toArray();

      // Populate artist data for each song
      const db = getDB();
      const artistsCollection = db.collection('artists');

      const populatedSongs = await Promise.all(
        songs.map(async (song) => {
          // Fetch artist info - handle both old (artist_id) and new (artist_ids array) format
          let artistDisplay = 'Unknown Artist';
          let artistImageUrl = '';

          // New format: artist_ids array
          if (song.artist_ids && song.artist_ids.length > 0) {
            const artistsData = await artistsCollection
              .find({ _id: { $in: song.artist_ids } })
              .toArray();

            // Use artist_subtitle if available (full string from Shazam)
            artistDisplay = song.artist_subtitle || artistsData.map((a) => a.name).join(', ');
            artistImageUrl = artistsData[0]?.image_url || '';
          }
          // Old format: single artist_id (for backward compatibility)
          else if (song.artist_id) {
            const artistInfo = await artistsCollection.findOne({ _id: song.artist_id });
            artistDisplay = artistInfo?.name || 'Unknown Artist';
            artistImageUrl = artistInfo?.image_url || '';
          }

          // Return song with populated artist data
          return {
            _id: song._id,
            isrc: song.isrc,
            title: song.title,
            artist: artistDisplay, // Full artist string or single artist name
            artist_image_url: artistImageUrl,
            album: song.album,
            cover_art_url: song.cover_art_url,
            duration_ms: song.duration_ms,
            spotify_url: song.spotify_url || '',
            apple_music_url: song.apple_music_url || '',
            preview_url: song.preview_url || '',
            youtube: song.youtube_url || '', // From database
            genre: song.genre,
            release_date: song.release_date,
          };
        })
      );

      return res.status(200).json({ search_history: populatedSongs });
    } catch (error) {
      next(error);
    }
  }

  static async deleteHistoryItem(req, res, next) {
    try {
      const { song_id } = req.params;
      const user_id = req.user._id;
      const collection = UserController.getCollection();

      const result = await collection.updateOne(
        { _id: user_id },
        { $pull: { search_history: song_id } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Song not found in history' });
      }

      return res.status(200).json({ message: 'Song removed from history' });
    } catch (error) {
      next(error);
    }
  }

  static async clearAllHistory(req, res, next) {
    try {
      const user_id = req.user._id;
      const collection = UserController.getCollection();

      await collection.updateOne({ _id: user_id }, { $set: { search_history: [] } });

      return res.status(200).json({ message: 'All history cleared' });
    } catch (error) {
      next(error);
    }
  }

  static async getArtistsFromHistory(req, res, next) {
    try {
      const user_id = req.user._id;
      const collection = UserController.getCollection();
      const user = await collection.findOne({ _id: user_id });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If no search history, return empty array
      if (!user.search_history || user.search_history.length === 0) {
        return res.status(200).json({ artists: [] });
      }

      // Get all songs from user's search history
      const collectionSong = Controller.getCollection();
      const songIds = user.search_history.map((id) => new ObjectId(id));
      const songs = await collectionSong.find({ _id: { $in: songIds } }).toArray();

      // Extract unique artist IDs from all songs
      const artistIdSet = new Set();
      songs.forEach((song) => {
        if (song.artist_ids && Array.isArray(song.artist_ids)) {
          song.artist_ids.forEach((id) => artistIdSet.add(id.toString()));
        }
      });

      // Convert Set to array of ObjectId
      const uniqueArtistIds = Array.from(artistIdSet).map((id) => new ObjectId(id));

      // Fetch artist data
      const db = getDB();
      const artistsCollection = db.collection('artists');
      const artists = await artistsCollection
        .find({ _id: { $in: uniqueArtistIds } })
        .toArray();

      // Return artists with their data
      const artistsData = artists.map((artist) => ({
        _id: artist._id,
        name: artist.name,
        slug: artist.slug,
        image_url: artist.image_url,
      }));

      return res.status(200).json({ artists: artistsData });
    } catch (error) {
      next(error);
    }
  }

  // ============= PLAYLIST ENDPOINTS =============

  static async createPlaylist(req, res, next) {
    try {
      const { name, description } = req.body;
      const user_id = req.user._id;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Playlist name is required' });
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const newPlaylist = {
        name: name.trim(),
        description: description?.trim() || '',
        user_id: user_id,
        songs: [], // Array of song IDs
        cover_images: [], // Will store up to 4 cover art URLs for grid display
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await playlistsCollection.insertOne(newPlaylist);
      const createdPlaylist = { _id: result.insertedId, ...newPlaylist };

      return res.status(201).json(createdPlaylist);
    } catch (error) {
      next(error);
    }
  }

  static async getUserPlaylists(req, res, next) {
    try {
      const user_id = req.user._id;
      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const playlists = await playlistsCollection.find({ user_id }).sort({ created_at: -1 }).toArray();

      // Populate each playlist with song count and cover images
      const populatedPlaylists = await Promise.all(
        playlists.map(async (playlist) => {
          const songCount = playlist.songs?.length || 0;

          // Get up to 4 cover images from songs in the playlist
          let coverImages = [];
          if (songCount > 0) {
            const songsCollection = Controller.getCollection();
            const songIds = playlist.songs.slice(0, 4).map((id) => new ObjectId(id));
            const songs = await songsCollection.find({ _id: { $in: songIds } }).toArray();
            coverImages = songs.map((song) => song.cover_art_url).filter(Boolean);
          }

          return {
            _id: playlist._id,
            name: playlist.name,
            description: playlist.description || '',
            song_count: songCount,
            cover_images: coverImages,
            created_at: playlist.created_at,
            updated_at: playlist.updated_at,
          };
        })
      );

      return res.status(200).json({ playlists: populatedPlaylists });
    } catch (error) {
      next(error);
    }
  }

  static async getPlaylistById(req, res, next) {
    try {
      const { playlist_id } = req.params;
      const user_id = req.user._id;

      if (!ObjectId.isValid(playlist_id)) {
        return res.status(400).json({ message: 'Invalid playlist ID format' });
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const playlist = await playlistsCollection.findOne({
        _id: new ObjectId(playlist_id),
        user_id: user_id,
      });

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      // Populate songs with full data
      let populatedSongs = [];
      if (playlist.songs && playlist.songs.length > 0) {
        const songsCollection = Controller.getCollection();
        const artistsCollection = db.collection('artists');
        const songIds = playlist.songs.map((id) => new ObjectId(id));
        const songs = await songsCollection.find({ _id: { $in: songIds } }).toArray();

        populatedSongs = await Promise.all(
          songs.map(async (song) => {
            let artistDisplay = 'Unknown Artist';
            let artistImageUrl = '';

            if (song.artist_ids && song.artist_ids.length > 0) {
              const artistsData = await artistsCollection
                .find({ _id: { $in: song.artist_ids } })
                .toArray();
              artistDisplay = song.artist_subtitle || artistsData.map((a) => a.name).join(', ');
              artistImageUrl = artistsData[0]?.image_url || '';
            }

            return {
              _id: song._id,
              title: song.title,
              artist: artistDisplay,
              artist_image_url: artistImageUrl,
              album: song.album,
              cover_art_url: song.cover_art_url,
              duration_ms: song.duration_ms,
            };
          })
        );
      }

      return res.status(200).json({
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description || '',
        songs: populatedSongs,
        song_count: populatedSongs.length,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addSongToPlaylist(req, res, next) {
    try {
      const { playlist_id } = req.params;
      const { song_id } = req.body;
      const user_id = req.user._id;

      if (!ObjectId.isValid(playlist_id)) {
        return res.status(400).json({ message: 'Invalid playlist ID format' });
      }

      if (!song_id) {
        return res.status(400).json({ message: 'song_id is required' });
      }

      // Verify song exists
      const songsCollection = Controller.getCollection();
      const song = await songsCollection.findOne({ _id: new ObjectId(song_id) });
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const playlist = await playlistsCollection.findOne({
        _id: new ObjectId(playlist_id),
        user_id: user_id,
      });

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      // Check if song already in playlist
      if (playlist.songs && playlist.songs.includes(song_id)) {
        return res.status(400).json({ message: 'Song already in playlist' });
      }

      // Add song to playlist
      await playlistsCollection.updateOne(
        { _id: new ObjectId(playlist_id) },
        {
          $push: { songs: song_id },
          $set: { updated_at: new Date() },
        }
      );

      return res.status(200).json({ message: 'Song added to playlist' });
    } catch (error) {
      next(error);
    }
  }

  static async removeSongFromPlaylist(req, res, next) {
    try {
      const { playlist_id, song_id } = req.params;
      const user_id = req.user._id;

      if (!ObjectId.isValid(playlist_id)) {
        return res.status(400).json({ message: 'Invalid playlist ID format' });
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const result = await playlistsCollection.updateOne(
        { _id: new ObjectId(playlist_id), user_id: user_id },
        {
          $pull: { songs: song_id },
          $set: { updated_at: new Date() },
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Playlist not found or song not in playlist' });
      }

      return res.status(200).json({ message: 'Song removed from playlist' });
    } catch (error) {
      next(error);
    }
  }

  static async deletePlaylist(req, res, next) {
    try {
      const { playlist_id } = req.params;
      const user_id = req.user._id;

      if (!ObjectId.isValid(playlist_id)) {
        return res.status(400).json({ message: 'Invalid playlist ID format' });
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const result = await playlistsCollection.deleteOne({
        _id: new ObjectId(playlist_id),
        user_id: user_id,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      return res.status(200).json({ message: 'Playlist deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlaylist(req, res, next) {
    try {
      const { playlist_id } = req.params;
      const { name, description } = req.body;
      const user_id = req.user._id;

      if (!ObjectId.isValid(playlist_id)) {
        return res.status(400).json({ message: 'Invalid playlist ID format' });
      }

      const updateData = { updated_at: new Date() };
      if (name && name.trim().length > 0) {
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description.trim();
      }

      const db = getDB();
      const playlistsCollection = db.collection('playlists');

      const result = await playlistsCollection.updateOne(
        { _id: new ObjectId(playlist_id), user_id: user_id },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      return res.status(200).json({ message: 'Playlist updated' });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = UserController;
