const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');
const axios = require('axios');
const FormData = require('form-data');

class Controller {
  static getCollection() {
    const db = getDB();
    const collection = db.collection('songs');
    return collection;
  }

  static getArtistsCollection() {
    const db = getDB();
    const collection = db.collection('artists');
    return collection;
  }

  // Spotify API Integration
  static async getSpotifyToken() {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
              ).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('❌ Error getting Spotify token:', error.message);
      return null;
    }
  }

  static async searchSpotifyArtist(artistName, token) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: artistName,
          type: 'artist',
          limit: 1,
        },
      });

      if (response.data.artists.items.length > 0) {
        const artist = response.data.artists.items[0];
        return {
          name: artist.name,
          image_url: artist.images[0]?.url || '',
          spotify_url: artist.external_urls.spotify || '',
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ Error searching Spotify artist "${artistName}":`, error.message);
      return null;
    }
  }

  static async searchSpotifyTrack(isrc, token) {
    try {
      // Search by ISRC first (most accurate)
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: `isrc:${isrc}`,
          type: 'track',
          limit: 1,
        },
      });

      if (response.data.tracks.items.length > 0) {
        const track = response.data.tracks.items[0];
        return {
          duration_ms: track.duration_ms,
          spotify_url: track.external_urls.spotify || '',
          spotify_uri: track.uri || '',
          album: track.album.name || 'Unknown Album',
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ Error searching Spotify track with ISRC "${isrc}":`, error.message);
      return null;
    }
  }

  static async findOrCreateArtist(artistData) {
    const collection = Controller.getArtistsCollection();

    // Create slug from artist name (lowercase, trim, replace spaces with hyphens)
    const slug = artistData.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, ''); // Remove special characters except hyphens

    // Try to find by slug (unique identifier based on name)
    const existingArtist = await collection.findOne({ slug });

    if (existingArtist) {
      return existingArtist;
    }

    // Create new artist (name, slug, image_url)
    const newArtist = {
      name: artistData.name,
      slug: slug,
      image_url: artistData.image_url || '',
      created_at: new Date(),
    };

    const result = await collection.insertOne(newArtist);
    return { _id: result.insertedId, ...newArtist };
  }
  static async findAll(req, res, next) {
    try {
      res.status(200).json({ message: 'AKU JALAN' });
    } catch (error) {
      next(error);
    }
  }

  // Test endpoints for Spotify API
  static async testSpotifyToken(req, res, next) {
    try {
      const token = await Controller.getSpotifyToken();
      if (token) {
        return res.status(200).json({
          success: true,
          message: 'Spotify token generated successfully',
          token: token.substring(0, 20) + '...', // Show only first 20 chars for security
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate Spotify token. Check your CLIENT_ID and CLIENT_SECRET',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async testSpotifyArtist(req, res, next) {
    try {
      const { artist_name } = req.query;
      if (!artist_name) {
        return res.status(400).json({ message: 'artist_name query parameter is required' });
      }

      const token = await Controller.getSpotifyToken();
      if (!token) {
        return res.status(500).json({ message: 'Failed to get Spotify token' });
      }

      const artistData = await Controller.searchSpotifyArtist(artist_name, token);
      if (artistData) {
        return res.status(200).json({
          success: true,
          message: 'Artist found on Spotify',
          data: artistData,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Artist not found on Spotify',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async testSpotifyTrack(req, res, next) {
    try {
      const { isrc } = req.query;
      if (!isrc) {
        return res.status(400).json({ message: 'isrc query parameter is required' });
      }

      const token = await Controller.getSpotifyToken();
      if (!token) {
        return res.status(500).json({ message: 'Failed to get Spotify token' });
      }

      const trackData = await Controller.searchSpotifyTrack(isrc, token);
      if (trackData) {
        return res.status(200).json({
          success: true,
          message: 'Track found on Spotify',
          data: trackData,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Track not found on Spotify with this ISRC',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async findOrCreateSong(req, res, next) {
    try {
      const {
        isrc,
        title,
        artist,
        album,
        cover_art_url,
        duration_ms,
        spotify_url,
        apple_music_url,
        preview_url,
        release_date,
        genre,
      } = req.body;
      const collection = Controller.getCollection();

      const data = await collection.findOne({ isrc: req.body.isrc });
      if (!data) {
        const newSong = {
          isrc,
          title,
          artist,
          album,
          release_date,
          cover_art_url,
          duration_ms,
          spotify_url,
          apple_music_url,
          preview_url,
          genre,
        };
        const result = await collection.insertOne(newSong);
        const newSongWithId = { _id: result.insertedId, ...newSong };
        return res.status(201).json({ ...newSongWithId });
      }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async recognizeSong(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      console.log('🎵 Recognizing song with Shazam API...');

      const formData = new FormData();
      formData.append('upload_file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const shazamResponse = await axios({
        method: 'POST',
        url: 'https://shazam-api6.p.rapidapi.com/shazam/recognize/',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST,
          ...formData.getHeaders(),
        },
        data: formData,
        timeout: 30000,
      });

      if (!shazamResponse.data || !shazamResponse.data.track) {
        return res.status(404).json({
          message: 'Song not found',
          error: 'Could not identify the song',
        });
      }

      const track = shazamResponse.data.track;

      // Parse Shazam response
      const isrc = track.isrc || '';
      const title = track.title || 'Unknown';
      const artistName = track.subtitle || 'Unknown Artist';

      // Album - Shazam API doesn't provide album in this response structure
      const album = 'Unknown Album';

      // Get images - use high quality cover art
      const cover_art_url = track.images?.coverarthq || track.images?.coverart || '';

      // Get Apple Music URL from hub.actions
      let apple_music_url = '';
      if (track.hub?.actions && track.hub.actions.length > 0) {
        const appleMusicAction = track.hub.actions.find(
          (a) => a.type === 'applemusicplay' || a.name === 'apple'
        );
        if (appleMusicAction && appleMusicAction.id) {
          apple_music_url = `https://music.apple.com/song/${appleMusicAction.id}`;
        }
      }

      // Get preview URL (30-second audio preview)
      let preview_url = '';
      if (track.hub?.actions) {
        const previewAction = track.hub.actions.find((a) => a.type === 'uri');
        if (previewAction && previewAction.uri) {
          preview_url = previewAction.uri;
        }
      }

      // Parse release date - not available in this response, use current date
      const release_date = new Date();

      // Get genre
      const genre = track.genres?.primary || 'Unknown';

      // Duration - not provided in this response structure
      const duration_ms = 0;

      // Spotify URL - Can be constructed from ISRC or left empty
      const spotify_url = '';

      // Get artist image (background)
      const artist_image_url = track.images?.background || '';

      console.log('📝 Parsed song data:', { title, artist: artistName, isrc });

      // Parse artists - subtitle can have multiple artists separated by comma/&
      // Example: "Jessie J, Ariana Grande & Nicki Minaj"
      const artistNames = artistName
        .split(/[,&]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      console.log('✅ Found artists:', artistNames);

      // Get Spotify token
      console.log('🎵 Fetching Spotify token...');
      const spotifyToken = await Controller.getSpotifyToken();

      // Fetch Spotify data for track (duration, spotify_url, album)
      let spotifyTrackData = null;
      if (spotifyToken && isrc) {
        console.log('🎵 Searching Spotify track by ISRC...');
        spotifyTrackData = await Controller.searchSpotifyTrack(isrc, spotifyToken);
        if (spotifyTrackData) {
          console.log('✅ Spotify track found:', spotifyTrackData);
        } else {
          console.log('⚠️ Spotify track not found, using Shazam data');
        }
      }

      // Create or find all artists (fetch Spotify images in parallel)
      const artistIds = [];
      console.log('🎵 Fetching artist data from Spotify...');

      // Fetch all artist data from Spotify in parallel
      const spotifyArtistPromises = artistNames.map((name) =>
        spotifyToken ? Controller.searchSpotifyArtist(name, spotifyToken) : Promise.resolve(null)
      );
      const spotifyArtistsData = await Promise.all(spotifyArtistPromises);

      // Process each artist with their Spotify data
      for (let i = 0; i < artistNames.length; i++) {
        const name = artistNames[i];
        const spotifyData = spotifyArtistsData[i];

        // Use Spotify image if available, fallback to Shazam background image
        const artistImageUrl = spotifyData?.image_url || artist_image_url;

        const artist = await Controller.findOrCreateArtist({
          name: name,
          image_url: artistImageUrl,
        });

        artistIds.push(artist._id);
        console.log(
          '✅ Artist processed:',
          artist.name,
          '(ID:',
          artist._id.toString(),
          ')',
          'Slug:',
          artist.slug,
          spotifyData ? '(Spotify image)' : '(Shazam fallback)'
        );
      }

      // Generate YouTube search URL with full artist string
      const youtube_url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        artistName + ' ' + title
      )}`;

      // Check if song exists in database
      const collection = Controller.getCollection();
      let songData = await collection.findOne({ isrc });

      if (!songData) {
        // Use Spotify data if available, fallback to Shazam data
        const finalDuration = spotifyTrackData?.duration_ms || duration_ms;
        const finalSpotifyUrl = spotifyTrackData?.spotify_url || spotify_url;
        const finalAlbum = spotifyTrackData?.album || album;

        // Insert new song with artist_ids array
        const newSong = {
          isrc,
          title,
          artist_ids: artistIds, // Array of ObjectId references to artists collection
          artist_subtitle: artistName, // Full artist string from Shazam (e.g., "Jessie J, Ariana Grande & Nicki Minaj")
          album: finalAlbum, // From Spotify if available
          release_date,
          cover_art_url,
          duration_ms: finalDuration, // From Spotify if available
          spotify_url: finalSpotifyUrl, // From Spotify if available
          spotify_uri: spotifyTrackData?.spotify_uri || '', // Spotify URI
          apple_music_url,
          preview_url,
          youtube_url, // YouTube search URL
          genre,
          created_at: new Date(),
        };

        const result = await collection.insertOne(newSong);
        songData = { _id: result.insertedId, ...newSong };
        console.log('✅ New song saved to database');
      } else {
        console.log('✅ Song already exists in database');
      }

      // Add to user search history if device_id provided
      if (req.headers['x-device-id']) {
        try {
          const db = getDB();
          const usersCollection = db.collection('users');
          const user = await usersCollection.findOne({
            device_id: req.headers['x-device-id'],
          });

          if (user) {
            const songId = songData._id.toString();
            const searchHistory = user.search_history || [];

            // Add to history if not already present
            if (!searchHistory.includes(songId)) {
              await usersCollection.updateOne(
                { _id: user._id },
                { $push: { search_history: songId } }
              );
              console.log('✅ Added to user search history');
            }
          }
        } catch (historyError) {
          console.error('⚠️ Error adding to history:', historyError.message);
          // Don't fail the request if history update fails
        }
      }

      // Populate artist data for client response
      // Fetch all artists if song already exists
      let artistsData = [];
      let artistImageUrl = '';

      if (songData.artist_ids && songData.artist_ids.length > 0) {
        const artistsCollection = Controller.getArtistsCollection();
        artistsData = await artistsCollection.find({ _id: { $in: songData.artist_ids } }).toArray();

        // Use first artist's image as primary
        artistImageUrl = artistsData[0]?.image_url || '';
      }

      // Use artist_subtitle for display (full string from Shazam)
      const artistDisplay = songData.artist_subtitle || 'Unknown Artist';

      // Return song data with populated artist info
      return res.status(200).json({
        _id: songData._id,
        isrc: songData.isrc,
        title: songData.title,
        artist: artistDisplay, // Full artist string (e.g., "Jessie J, Ariana Grande & Nicki Minaj")
        artist_ids: songData.artist_ids, // Array of ObjectId
        artist_image_url: artistImageUrl, // First artist's photo
        album: songData.album,
        cover_art_url: songData.cover_art_url,
        duration_ms: songData.duration_ms,
        spotify_url: songData.spotify_url,
        spotify_uri: songData.spotify_uri || '', // Spotify URI
        apple_music_url: songData.apple_music_url,
        preview_url: songData.preview_url,
        youtube: songData.youtube_url, // From database
        genre: songData.genre,
        release_date: songData.release_date,
      });
    } catch (error) {
      console.error('❌ Error in recognizeSong:', error.message);

      if (error.response) {
        // Shazam API error
        console.error('Shazam API error:', error.response.data);
        return res.status(error.response.status).json({
          message: 'Failed to recognize song',
          error: error.response.data.message || 'Shazam API error',
        });
      }

      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          message: 'Request timeout',
          error: 'Song recognition took too long',
        });
      }

      next(error);
    }
  }
}

module.exports = Controller;
