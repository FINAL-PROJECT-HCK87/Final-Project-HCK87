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

  static async getArtistConcerts(req, res, next) {
    try {
      const artistId = req.params.id;

      console.log(`🎤 Fetching concerts for artist ID: ${artistId}`);

      // Validate ObjectId format
      if (!ObjectId.isValid(artistId)) {
        console.log(`❌ Invalid ObjectId format: ${artistId}`);
        return res.status(400).json({ message: 'Invalid artist ID format' });
      }

      const artistsCollection = Controller.getArtistsCollection();
      const artist = await artistsCollection.findOne({ _id: new ObjectId(artistId) });

      if (!artist) {
        console.log(`❌ Artist not found with ID: ${artistId}`);
        return res.status(404).json({ message: 'Artist not found' });
      }

      console.log(`🎵 Artist found: "${artist.name}"`);

      // Get query parameters
      const date = req.query.date || 'upcoming'; // Default: upcoming events
      const country = req.query.country || null; // Optional country filter
      const limit = parseInt(req.query.limit) || 50; // Default: 50 events

      // Fetch concerts from Ticketmaster Discovery API (more reliable than Bandsintown)
      try {
        const ticketmaster_url = `https://app.ticketmaster.com/discovery/v2/events.json`;

        console.log(`🔍 Fetching from Ticketmaster API for artist: "${artist.name}"`);
        console.log(`📅 Date filter: ${date}, Country filter: ${country || 'none'}`);

        // Build query params
        const params = {
          apikey: process.env.TICKETMASTER_API_KEY || 'YOUR_API_KEY_HERE', // Get from env
          keyword: artist.name, // Search by artist name
          classificationName: 'music', // Only music events
          size: limit || 50, // Number of results
          sort: 'date,asc', // Sort by date ascending
        };

        // Add country filter if specified
        if (country) {
          // Ticketmaster uses country codes (US, GB, CA, etc.)
          const countryCodes = {
            'United States': 'US',
            'United Kingdom': 'GB',
            Indonesia: 'ID',
            Japan: 'JP',
            Singapore: 'SG',
            Canada: 'CA',
            Australia: 'AU',
          };
          params.countryCode = countryCodes[country] || country;
        }

        const response = await axios.get(ticketmaster_url, {
          params: params,
          timeout: 10000, // 10 second timeout
        });

        // Parse Ticketmaster response
        const events = response.data._embedded?.events || [];

        console.log(`✅ Ticketmaster returned ${events.length} events`);

        // Format response to match our schema
        const formattedConcerts = events.map((event) => {
          const venue = event._embedded?.venues?.[0] || {};
          const attraction = event._embedded?.attractions?.[0] || {};

          return {
            id: event.id,
            title: event.name || `${artist.name} Live`,
            datetime: event.dates?.start?.dateTime || event.dates?.start?.localDate || '',
            venue: {
              name: venue.name || 'Venue TBA',
              city: venue.city?.name || '',
              region: venue.state?.stateCode || venue.state?.name || '',
              country: venue.country?.name || venue.country?.countryCode || '',
              latitude: venue.location?.latitude || '',
              longitude: venue.location?.longitude || '',
            },
            lineup: event._embedded?.attractions?.map((a) => a.name) || [artist.name],
            description: event.info || event.pleaseNote || '',
            url: event.url || '', // Ticketmaster event page URL
            offers:
              event.priceRanges?.map((price) => ({
                type: price.type,
                currency: price.currency,
                min: price.min,
                max: price.max,
              })) || [],
          };
        });

        console.log(`✅ Formatted ${formattedConcerts.length} concerts`);

        return res.status(200).json({
          artist: {
            _id: artist._id,
            name: artist.name,
            image_url: artist.image_url || '',
          },
          concerts: formattedConcerts,
          total: formattedConcerts.length,
        });
      } catch (ticketmasterError) {
        // Handle Ticketmaster API errors
        if (ticketmasterError.response?.status === 404) {
          console.log(`⚠️  No events found for "${artist.name}"`);
          return res.status(200).json({
            artist: {
              _id: artist._id,
              name: artist.name,
              image_url: artist.image_url || '',
            },
            concerts: [],
            total: 0,
            message: 'No upcoming concerts found for this artist',
          });
        }

        if (ticketmasterError.response?.status === 401) {
          console.error('❌ Ticketmaster API 401 Unauthorized - invalid API key');
          return res.status(200).json({
            artist: {
              _id: artist._id,
              name: artist.name,
              image_url: artist.image_url || '',
            },
            concerts: [],
            total: 0,
            message: 'Concert service temporarily unavailable. Please check API configuration.',
          });
        }

        if (ticketmasterError.response?.status === 429) {
          console.error('❌ Ticketmaster API 429 Rate Limit - too many requests');
          return res.status(200).json({
            artist: {
              _id: artist._id,
              name: artist.name,
              image_url: artist.image_url || '',
            },
            concerts: [],
            total: 0,
            message: 'Too many requests. Please try again in a few minutes.',
          });
        }

        if (ticketmasterError.code === 'ECONNABORTED') {
          console.error('❌ Ticketmaster API timeout');
          return res.status(200).json({
            artist: {
              _id: artist._id,
              name: artist.name,
              image_url: artist.image_url || '',
            },
            concerts: [],
            total: 0,
            message: 'Request timeout. Please try again.',
          });
        }

        console.error('❌ Ticketmaster API error:', ticketmasterError.message);
        console.error('Response status:', ticketmasterError.response?.status);
        console.error('Response data:', ticketmasterError.response?.data);

        return res.status(200).json({
          artist: {
            _id: artist._id,
            name: artist.name,
            image_url: artist.image_url || '',
          },
          concerts: [],
          total: 0,
          message: 'Unable to fetch concerts. Please try again later.',
        });
      }
    } catch (error) {
      console.error('❌ Error in getArtistConcerts:', error.message);
      console.error('Stack trace:', error.stack);

      return res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
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
        timeout: 60000, // 60 seconds timeout for Shazam API
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
          error: error.response.data.message || 'Song not found',
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

  static async songById(req, res, next) {
    try {
      const songId = req.params.id;

      // Validate ObjectId format
      if (!ObjectId.isValid(songId)) {
        return res.status(400).json({ message: 'Invalid song ID format' });
      }

      const collection = Controller.getCollection();
      const songData = await collection.findOne({ _id: new ObjectId(songId) });
      // console.log(songData, '<<<<<<<');

      if (!songData) {
        return res.status(404).json({ message: 'Song not found' });
      }
      // Populate artist data
      let artistsData = [];
      let artistImageUrl = '';
      if (songData.artist_ids && songData.artist_ids.length > 0) {
        const artistsCollection = Controller.getArtistsCollection();
        artistsData = await artistsCollection.find({ _id: { $in: songData.artist_ids } }).toArray();
        // Use first artist's image as primary
        artistImageUrl = artistsData[0]?.image_url || '';
      }
      const artistDisplay = songData.artist_subtitle || 'Unknown Artist';
      return res.status(200).json({
        _id: songData._id,
        isrc: songData.isrc,
        title: songData.title,
        artist: artistDisplay,
        artist_ids: songData.artist_ids,
        artist_image_url: artistImageUrl,
        album: songData.album,
        cover_art_url: songData.cover_art_url,
        duration_ms: songData.duration_ms,
        spotify_url: songData.spotify_url,
        spotify_uri: songData.spotify_uri || '',
        apple_music_url: songData.apple_music_url,
        preview_url: songData.preview_url,
        youtube_url: songData.youtube_url,
        genre: songData.genre,
        release_date: songData.release_date,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopSongs(req, res, next) {
    try {
      const db = getDB();
      const usersCollection = db.collection('users');
      const songsCollection = Controller.getCollection();
      const artistsCollection = Controller.getArtistsCollection();

      // Aggregate all search histories from all users
      const allUsers = await usersCollection.find({}).toArray();

      // Count frequency of each song across all users
      const songCounts = {};
      allUsers.forEach((user) => {
        if (user.search_history && Array.isArray(user.search_history)) {
          user.search_history.forEach((songId) => {
            const songIdStr = String(songId);
            songCounts[songIdStr] = (songCounts[songIdStr] || 0) + 1;
          });
        }
      });

      // Sort by count and get top 4
      const topSongIds = Object.entries(songCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([songId]) => new ObjectId(songId));

      if (topSongIds.length === 0) {
        return res.status(200).json({ top_songs: [] });
      }

      // Fetch song details
      const topSongs = await songsCollection.find({ _id: { $in: topSongIds } }).toArray();

      // Populate artist data for each song
      const topSongsWithArtists = await Promise.all(
        topSongs.map(async (song) => {
          let artistImageUrl = '';
          if (song.artist_ids && song.artist_ids.length > 0) {
            const artistsData = await artistsCollection
              .find({ _id: { $in: song.artist_ids } })
              .toArray();
            artistImageUrl = artistsData[0]?.image_url || '';
          }

          const artistDisplay = song.artist_subtitle || 'Unknown Artist';

          return {
            _id: song._id,
            title: song.title,
            artist: artistDisplay,
            artist_image_url: artistImageUrl,
            cover_art_url: song.cover_art_url,
            search_count: songCounts[song._id.toString()],
          };
        })
      );

      // Sort by original order (by count)
      const sortedTopSongs = topSongsWithArtists.sort((a, b) => {
        const indexA = topSongIds.findIndex((id) => id.toString() === a._id.toString());
        const indexB = topSongIds.findIndex((id) => id.toString() === b._id.toString());
        return indexA - indexB;
      });

      return res.status(200).json({ top_songs: sortedTopSongs });
    } catch (error) {
      console.error('❌ Error in getTopSongs:', error.message);
      next(error);
    }
  }
}

module.exports = Controller;
