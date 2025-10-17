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
}
module.exports = UserController;
