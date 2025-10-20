const request = require('supertest');
const app = require('../app');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// Mock MongoDB connection
jest.mock('../config/mongodb', () => ({
  getDB: jest.fn()
}));

// Mock axios for external API calls
jest.mock('axios');
const axios = require('axios');

describe('Songs API Endpoints', () => {
  let mockDb;
  let mockSongsCollection;
  let mockUsersCollection;
  let mockArtistsCollection;

  beforeAll(() => {
    // Setup mock collections
    mockSongsCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn()
    };

    mockUsersCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn()
    };

    mockArtistsCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      find: jest.fn()
    };

    mockDb = {
      collection: jest.fn((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'artists') return mockArtistsCollection;
        return {
          findOne: jest.fn(),
          find: jest.fn(() => ({ toArray: jest.fn() }))
        };
      })
    };

    getDB.mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /songs/:id - Get Song by ID', () => {
    it('should return song details by ID', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockSong = {
        _id: songId,
        isrc: 'TEST123',
        title: 'Test Song',
        artist_subtitle: 'Test Artist',
        artist_ids: [artistId],
        album: 'Test Album',
        cover_art_url: 'http://example.com/cover.jpg',
        duration_ms: 180000,
        spotify_url: 'http://spotify.com/track',
        apple_music_url: 'http://music.apple.com/track',
        preview_url: 'http://example.com/preview.mp3',
        youtube_url: 'http://youtube.com/watch',
        genre: 'Pop',
        release_date: new Date('2023-01-01')
      };

      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      mockSongsCollection.findOne.mockResolvedValue(mockSong);
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockArtist])
      });

      const response = await request(app)
        .get(`/songs/${songId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(songId.toString());
      expect(response.body.title).toBe('Test Song');
      expect(response.body.artist).toBe('Test Artist');
      expect(mockSongsCollection.findOne).toHaveBeenCalledWith({
        _id: songId
      });
    });

    it('should return 400 for invalid song ID format', async () => {
      const response = await request(app)
        .get('/songs/invalid-id-format');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid song ID format');
    });

    it('should return 404 if song not found', async () => {
      const songId = new ObjectId();
      mockSongsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get(`/songs/${songId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Song not found');
    });
  });

  describe('POST /songs - Create/Find Song', () => {
    it('should return existing song if ISRC exists', async () => {
      const existingSong = {
        _id: new ObjectId(),
        isrc: 'EXISTING123',
        title: 'Existing Song',
        artist: 'Existing Artist',
        album: 'Existing Album'
      };

      mockSongsCollection.findOne.mockResolvedValue(existingSong);

      const response = await request(app)
        .post('/songs')
        .send({
          isrc: 'EXISTING123',
          title: 'Existing Song',
          artist: 'Existing Artist',
          album: 'Existing Album',
          cover_art_url: 'http://example.com/cover.jpg',
          duration_ms: 180000,
          spotify_url: 'http://spotify.com/track',
          apple_music_url: 'http://music.apple.com/track',
          preview_url: 'http://example.com/preview.mp3',
          release_date: '2023-01-01',
          genre: 'Pop'
        });

      expect(response.status).toBe(200);
      expect(response.body.isrc).toBe('EXISTING123');
      expect(mockSongsCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should create new song if ISRC does not exist', async () => {
      const newSongId = new ObjectId();

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({
        insertedId: newSongId
      });

      const response = await request(app)
        .post('/songs')
        .send({
          isrc: 'NEW123',
          title: 'New Song',
          artist: 'New Artist',
          album: 'New Album',
          cover_art_url: 'http://example.com/cover.jpg',
          duration_ms: 180000,
          spotify_url: 'http://spotify.com/track',
          apple_music_url: 'http://music.apple.com/track',
          preview_url: 'http://example.com/preview.mp3',
          release_date: '2023-01-01',
          genre: 'Pop'
        });

      expect(response.status).toBe(201);
      expect(response.body.isrc).toBe('NEW123');
      expect(response.body.title).toBe('New Song');
      expect(mockSongsCollection.insertOne).toHaveBeenCalled();
    });

    it('should handle missing optional fields when creating song', async () => {
      const newSongId = new ObjectId();

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({
        insertedId: newSongId
      });

      const response = await request(app)
        .post('/songs')
        .send({
          isrc: 'MINIMAL123',
          title: 'Minimal Song',
          artist: 'Minimal Artist'
          // Missing optional fields: album, cover_art_url, duration_ms, etc.
        });

      expect(response.status).toBe(201);
      expect(response.body.isrc).toBe('MINIMAL123');
      expect(mockSongsCollection.insertOne).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockSongsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/songs')
        .send({
          isrc: 'ERROR123',
          title: 'Error Song'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /songs/top/popular - Get Top Popular Songs', () => {
    it('should return top 4 most searched songs', async () => {
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      const artist1Id = new ObjectId();

      const mockUsers = [
        {
          _id: new ObjectId(),
          device_id: 'device1',
          search_history: [song1Id.toString(), song2Id.toString()]
        },
        {
          _id: new ObjectId(),
          device_id: 'device2',
          search_history: [song1Id.toString()]
        }
      ];

      const mockSongs = [
        {
          _id: song1Id,
          title: 'Popular Song 1',
          artist_subtitle: 'Artist 1',
          artist_ids: [artist1Id],
          cover_art_url: 'http://example.com/cover1.jpg'
        },
        {
          _id: song2Id,
          title: 'Popular Song 2',
          artist_subtitle: 'Artist 2',
          artist_ids: [],
          cover_art_url: 'http://example.com/cover2.jpg'
        }
      ];

      const mockArtists = [
        {
          _id: artist1Id,
          name: 'Artist 1',
          image_url: 'http://example.com/artist1.jpg'
        }
      ];

      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockUsers)
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs)
      });

      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockArtists)
      });

      const response = await request(app).get('/songs/top/popular');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('top_songs');
      expect(Array.isArray(response.body.top_songs)).toBe(true);
      expect(response.body.top_songs.length).toBeLessThanOrEqual(4);
    });

    it('should return empty array if no search history exists', async () => {
      mockUsersCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      });

      const response = await request(app).get('/songs/top/popular');

      expect(response.status).toBe(200);
      expect(response.body.top_songs).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockUsersCollection.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/songs/top/popular');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /songs/recognize - Recognize Song (Shazam Integration)', () => {
    it('should return 400 if no audio file provided', async () => {
      const response = await request(app)
        .post('/songs/recognize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No audio file provided');
    });

    it('should return existing song if already in database', async () => {
      const existingSongId = new ObjectId();
      const artistId = new ObjectId();

      const existingSong = {
        _id: existingSongId,
        isrc: 'EXISTING123',
        title: 'Existing Shazam Song',
        artist_subtitle: 'Existing Artist',
        artist_ids: [artistId],
        cover_art_url: 'http://example.com/existing.jpg',
        duration_ms: 200000,
        spotify_url: 'http://spotify.com/existing',
        apple_music_url: 'http://music.apple.com/existing',
        preview_url: 'http://example.com/preview.mp3',
        youtube_url: 'http://youtube.com/watch',
        genre: 'Rock',
        release_date: new Date('2024-01-01')
      };

      const mockArtist = {
        _id: artistId,
        name: 'Existing Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EXISTING123',
            title: 'Existing Shazam Song',
            subtitle: 'Existing Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg',
              background: 'http://example.com/bg.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'applemusicplay',
                  id: 'apple123'
                }
              ]
            },
            genres: {
              primary: 'Rock'
            }
          }
        }
      };

      // Mock Spotify token
      axios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-spotify-token'
        }
      });

      // Mock Shazam API call
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock Spotify search for track (found)
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [
              {
                duration_ms: 200000,
                external_urls: { spotify: 'http://spotify.com/track' },
                uri: 'spotify:track:123',
                album: { name: 'Test Album' }
              }
            ]
          }
        }
      });

      // Mock Spotify search for artist (found)
      axios.get.mockResolvedValueOnce({
        data: {
          artists: {
            items: [
              {
                name: 'Existing Artist',
                images: [{ url: 'http://spotify.com/artist.jpg' }],
                external_urls: { spotify: 'http://spotify.com/artist' }
              }
            ]
          }
        }
      });

      // Mock database operations - song already exists
      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      mockSongsCollection.findOne.mockResolvedValue(existingSong);
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockArtist])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(existingSongId.toString());
      expect(response.body.title).toBe('Existing Shazam Song');
      expect(mockSongsCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should recognize song and return song data', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      // Mock Shazam API response
      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SHAZAM123',
            title: 'Shazam Song',
            subtitle: 'Shazam Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg',
              background: 'http://example.com/bg.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'applemusicplay',
                  id: 'apple123'
                },
                {
                  type: 'uri',
                  uri: 'http://preview.mp3'
                }
              ]
            },
            genres: {
              primary: 'Pop'
            }
          }
        }
      };

      // Mock Spotify token
      axios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-spotify-token'
        }
      });

      // Mock Shazam API call
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock Spotify search for artist
      axios.get.mockResolvedValueOnce({
        data: {
          artists: {
            items: [
              {
                name: 'Shazam Artist',
                images: [{ url: 'http://spotify.com/artist.jpg' }],
                external_urls: { spotify: 'http://spotify.com/artist' }
              }
            ]
          }
        }
      });

      // Mock Spotify search for track
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [
              {
                duration_ms: 180000,
                external_urls: { spotify: 'http://spotify.com/track' },
                uri: 'spotify:track:123',
                album: { name: 'Test Album' }
              }
            ]
          }
        }
      });

      // Mock database operations
      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({
        insertedId: artistId
      });

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({
        insertedId: songId
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('artist');
    });

    it('should handle Spotify token error gracefully', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SHAZAM789',
            title: 'Test Song',
            subtitle: 'Test Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Mock Spotify token error
      axios.post.mockRejectedValueOnce(new Error('Spotify auth failed'));

      // Mock Shazam API call
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock database operations
      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      // Should still succeed without Spotify data
      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
    });

    it('should return 404 if song cannot be identified', async () => {
      // Mock Shazam API response with no track
      axios.mockResolvedValueOnce({
        data: {}
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Song not found');
    });

    it('should return 408 on timeout', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      axios.mockRejectedValueOnce(timeoutError);

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(408);
      expect(response.body.message).toBe('Request timeout');
    });

    it('should add song to user history if device_id provided', async () => {
      const userId = new ObjectId();
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SHAZAM123',
            title: 'Shazam Song',
            subtitle: 'Shazam Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Mock Spotify and Shazam responses
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock database operations
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .set('x-device-id', 'test-device-123')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(mockUsersCollection.updateOne).toHaveBeenCalled();
    });

    it('should handle Shazam API error with response data', async () => {
      const shazamError = {
        response: {
          status: 503,
          data: {
            message: 'Shazam service unavailable'
          }
        }
      };

      axios.mockRejectedValueOnce(shazamError);

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(503);
      expect(response.body.message).toBe('Failed to recognize song');
      expect(response.body.error).toBe('Shazam service unavailable');
    });

    it('should handle error when updating user history', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockUser = {
        _id: new ObjectId(),
        device_id: 'test-device-123',
        search_history: []
      };

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SHAZAM456',
            title: 'Test Song',
            subtitle: 'Test Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Mock Spotify and Shazam responses
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock database operations
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockRejectedValue(new Error('Database error'));
      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      // Should still succeed even if history update fails
      const response = await request(app)
        .post('/songs/recognize')
        .set('x-device-id', 'test-device-123')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
    });

    it('should handle Shazam response without images', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOIMAGE123',
            title: 'Song Without Images',
            subtitle: 'Artist Name',
            hub: { actions: [] },
            genres: {}
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.cover_art_url).toBe('');
    });

    it('should handle Apple Music action with name field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'APPLE123',
            title: 'Apple Music Song',
            subtitle: 'Apple Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  name: 'apple',
                  id: 'apple-song-id-123'
                }
              ]
            },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toContain('apple-song-id-123');
    });

    it('should handle preview URL from hub actions', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'PREVIEW123',
            title: 'Song With Preview',
            subtitle: 'Preview Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'uri',
                  uri: 'http://preview.audio.com/song.mp3'
                }
              ]
            },
            genres: { primary: 'Rock' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.preview_url).toBe('http://preview.audio.com/song.mp3');
    });

    it('should not search Spotify if no token available', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOTOKEN123',
            title: 'Song Without Token',
            subtitle: 'No Token Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      // Mock Spotify token returns null
      axios.post.mockResolvedValueOnce({
        data: { access_token: null }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
    });

    it('should skip adding to history if song already in user history', async () => {
      const userId = new ObjectId();
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-456',
        search_history: [songId.toString()] // Song already in history
      };

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EXISTING456',
            title: 'Existing Song',
            subtitle: 'Existing Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .set('x-device-id', 'test-device-456')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      // updateOne should NOT be called since song already in history
      expect(mockUsersCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should handle multiple artists separated by ampersand', async () => {
      const songId = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'MULTI123',
            title: 'Collaboration Song',
            subtitle: 'Artist One & Artist Two',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      // Mock first artist not found, second artist not found
      mockArtistsCollection.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      mockArtistsCollection.insertOne
        .mockResolvedValueOnce({ insertedId: artist1Id })
        .mockResolvedValueOnce({ insertedId: artist2Id });

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.artist).toBe('Artist One & Artist Two');
      expect(response.body.artist_ids.length).toBe(2);
    });
  });

  describe('GET /songs/:id - Get Song by ID with artist population', () => {
    it('should handle errors when populating artists', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockSong = {
        _id: songId,
        isrc: 'TEST123',
        title: 'Test Song',
        artist_subtitle: 'Test Artist',
        artist_ids: [artistId],
        album: 'Test Album',
        cover_art_url: 'http://example.com/cover.jpg',
        duration_ms: 180000,
        spotify_url: 'http://spotify.com/track',
        apple_music_url: 'http://music.apple.com/track',
        preview_url: 'http://example.com/preview.mp3',
        youtube_url: 'http://youtube.com/watch',
        genre: 'Pop',
        release_date: new Date('2023-01-01')
      };

      mockSongsCollection.findOne.mockResolvedValue(mockSong);
      mockArtistsCollection.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get(`/songs/${songId.toString()}`);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /artists/:id/concerts - Get Artist Concerts', () => {
    it('should return 400 for invalid artist ID format', async () => {
      const response = await request(app)
        .get('/artists/invalid-id/concerts');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid artist ID format');
    });

    it('should return 404 if artist not found', async () => {
      const artistId = new ObjectId();
      mockArtistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Artist not found');
    });

    it('should return concerts from Ticketmaster API', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event1',
                name: 'Test Artist Live',
                dates: {
                  start: {
                    dateTime: '2025-12-01T20:00:00Z',
                    localDate: '2025-12-01'
                  }
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Test Venue',
                      city: { name: 'Jakarta' },
                      state: { name: 'Jakarta' },
                      country: { name: 'Indonesia', countryCode: 'ID' },
                      location: {
                        latitude: '-6.2088',
                        longitude: '106.8456'
                      }
                    }
                  ],
                  attractions: [
                    {
                      name: 'Test Artist'
                    }
                  ]
                },
                url: 'http://ticketmaster.com/event1',
                priceRanges: [
                  {
                    min: 50,
                    max: 200,
                    currency: 'USD'
                  }
                ]
              }
            ]
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('artist');
      expect(response.body).toHaveProperty('concerts');
      expect(response.body.artist.name).toBe('Test Artist');
      expect(response.body.concerts).toBeInstanceOf(Array);
      expect(response.body.concerts.length).toBeGreaterThan(0);
      expect(response.body.concerts[0]).toHaveProperty('title');
      expect(response.body.concerts[0]).toHaveProperty('venue');
    });

    it('should handle concerts with country filter', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'International Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event2',
                name: 'International Artist Concert',
                dates: {
                  start: {
                    localDate: '2025-11-15'
                  }
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Madison Square Garden',
                      city: { name: 'New York' },
                      state: { stateCode: 'NY' },
                      country: { name: 'United States', countryCode: 'US' },
                      location: {}
                    }
                  ]
                },
                url: 'http://ticketmaster.com/event2'
              }
            ]
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`)
        .query({ country: 'United States', limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.concerts).toBeInstanceOf(Array);
    });

    it('should return empty array if no concerts found', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Unknown Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {} // No _embedded.events
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
    });

    it('should handle Ticketmaster API timeout', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockRejectedValueOnce(timeoutError);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
      expect(response.body.message).toContain('timeout');
    });

    it('should handle Ticketmaster API error', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockRejectedValueOnce(new Error('Ticketmaster API error'));

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
      expect(response.body.message).toContain('Unable to fetch concerts');
    });

    it('should handle concerts with missing venue details', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event3',
                name: 'Test Concert',
                dates: {
                  start: {}
                },
                _embedded: {
                  venues: [
                    {
                      // Minimal venue data
                      name: 'TBA Venue'
                    }
                  ]
                }
              }
            ]
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toBeInstanceOf(Array);
      expect(response.body.concerts[0].venue.name).toBe('TBA Venue');
    });

    it('should handle concerts with price ranges', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Expensive Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event-price',
                name: 'Premium Concert',
                dates: {
                  start: {
                    dateTime: '2025-12-25T20:00:00Z'
                  }
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Premium Venue',
                      city: { name: 'Los Angeles' },
                      state: { stateCode: 'CA' },
                      country: { countryCode: 'US' },
                      location: {}
                    }
                  ]
                },
                url: 'http://ticketmaster.com/event-price',
                priceRanges: [
                  {
                    min: 100,
                    max: 500,
                    currency: 'USD'
                  }
                ]
              }
            ]
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts[0]).toHaveProperty('offers');
      expect(response.body.concerts[0].offers.length).toBeGreaterThan(0);
      expect(response.body.concerts[0].offers[0].min).toBe(100);
      expect(response.body.concerts[0].offers[0].max).toBe(500);
    });

    it('should handle rate limit error from Ticketmaster', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Popular Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const rateLimitError = {
        response: {
          status: 429,
          data: {
            message: 'Rate limit exceeded'
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockRejectedValueOnce(rateLimitError);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
      expect(response.body.message).toContain('Too many requests');
    });

    it('should handle concerts with alternative country codes', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Global Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event-japan',
                name: 'Japan Tour',
                dates: {
                  start: {
                    localDate: '2026-01-15'
                  }
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Tokyo Dome',
                      city: { name: 'Tokyo' },
                      country: { name: 'Japan', countryCode: 'JP' },
                      location: {
                        latitude: '35.7056',
                        longitude: '139.7519'
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValueOnce(mockTicketmasterResponse);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`)
        .query({ country: 'Japan' });

      expect(response.status).toBe(200);
      expect(response.body.concerts).toBeInstanceOf(Array);
    });

    it('should handle 404 when Ticketmaster finds no events', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Rare Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'No events found'
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockRejectedValueOnce(notFoundError);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
      expect(response.body.message).toContain('No upcoming concerts found');
    });

    it('should handle 401 unauthorized error from Ticketmaster', async () => {
      const artistId = new ObjectId();
      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'http://example.com/artist.jpg'
      };

      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockRejectedValueOnce(unauthorizedError);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body.concerts).toEqual([]);
      expect(response.body.message).toContain('Concert service temporarily unavailable');
    });

    it('should handle generic internal server error', async () => {
      const artistId = new ObjectId();
      
      const genericError = new Error('Unexpected error');
      mockArtistsCollection.findOne.mockRejectedValueOnce(genericError);

      const response = await request(app)
        .get(`/artists/${artistId.toString()}/concerts`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('POST /songs/recognize - Additional Branch Coverage', () => {
    it('should handle successful Spotify artist search with images', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SPOTIFY789',
            title: 'Spotify Song',
            subtitle: 'Spotify Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Spotify Artist',
                images: [
                  { url: 'http://spotify.com/artist.jpg' }
                ],
                external_urls: {
                  spotify: 'http://spotify.com/artist/123'
                }
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Spotify Artist',
          image_url: 'http://spotify.com/artist.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Spotify Song');
    });

    it('should handle successful Spotify track search with complete data', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'TRACK456',
            title: 'Complete Track',
            subtitle: 'Complete Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Complete Track',
                album: {
                  name: 'Complete Album',
                  images: [
                    { url: 'http://spotify.com/album.jpg' }
                  ]
                },
                duration_ms: 240000,
                preview_url: 'http://spotify.com/preview.mp3',
                external_urls: {
                  spotify: 'http://spotify.com/track/456'
                },
                uri: 'spotify:track:456'
              }
            ]
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Complete Artist',
                images: [
                  { url: 'http://spotify.com/artist.jpg' }
                ],
                external_urls: {
                  spotify: 'http://spotify.com/artist/789'
                }
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get
        .mockResolvedValueOnce(mockSpotifyTrackResponse)
        .mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Complete Artist',
          image_url: 'http://spotify.com/artist.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Complete Track');
      expect(response.body.album).toBe('Complete Album');
      expect(response.body.duration_ms).toBe(240000);
    });

    it('should handle genre object with primary field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'GENRE123',
            title: 'Genre Song',
            subtitle: 'Genre Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: {
              primary: 'Hip-Hop'
            }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Genre Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.genre).toBe('Hip-Hop');
    });

    it('should handle Spotify artist search returning empty results', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOARTIST999',
            title: 'No Artist Song',
            subtitle: 'Unknown Artist Name',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Unknown' }
          }
        }
      };

      const mockSpotifyArtistEmptyResponse = {
        data: {
          artists: {
            items: []
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistEmptyResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Unknown Artist Name',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No Artist Song');
    });

    it('should handle Spotify track search returning empty results', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOTRACK888',
            title: 'No Track Song',
            subtitle: 'No Track Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      const mockSpotifyTrackEmptyResponse = {
        data: {
          tracks: {
            items: []
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackEmptyResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Track Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No Track Song');
    });

    it('should handle artist already existing in database', async () => {
      const songId = new ObjectId();
      const existingArtistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EXISTING777',
            title: 'Existing Artist Song',
            subtitle: 'Existing Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockExistingArtist = {
        _id: existingArtistId,
        name: 'Existing Artist',
        slug: 'existing-artist',
        image_url: 'http://example.com/existing-artist.jpg'
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(mockExistingArtist);
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockExistingArtist])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Existing Artist Song');
      expect(mockArtistsCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle generic error without response or code', async () => {
      const genericError = new Error('Unexpected database error');
      // No error.response and no error.code - should trigger next(error)
      
      axios.mockRejectedValueOnce(genericError);

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      // Should be handled by error middleware
      expect(response.status).toBe(500);
    });

    it('should handle Spotify artist search error when API call fails', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'SPOTIFYERROR999',
            title: 'Spotify Error Song',
            subtitle: 'Error Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      
      // Mock Spotify artist search to throw an error
      const spotifyError = new Error('Spotify API failure');
      axios.get.mockRejectedValueOnce(spotifyError);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Error Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      // Should still succeed with fallback data
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Spotify Error Song');
    });

    it('should handle Spotify track search with valid ISRC', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'VALIDISRC123',
            title: 'ISRC Song',
            subtitle: 'ISRC Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Electronic' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'ISRC Song',
                album: {
                  name: 'ISRC Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 220000,
                preview_url: 'http://spotify.com/preview.mp3',
                external_urls: {
                  spotify: 'http://spotify.com/track/isrc123'
                },
                uri: 'spotify:track:isrc123'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'ISRC Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('ISRC Song');
      expect(response.body.album).toBe('ISRC Album');
    });

    it('should handle Spotify artist without images', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOIMAGES456',
            title: 'No Images Song',
            subtitle: 'No Images Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Indie' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'No Images Artist',
                images: [], // Empty images array
                external_urls: {
                  spotify: 'http://spotify.com/artist/noimg'
                }
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Images Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No Images Song');
    });

    it('should handle Spotify artist without external_urls', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOURL789',
            title: 'No URL Song',
            subtitle: 'No URL Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Alternative' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'No URL Artist',
                images: [{ url: 'http://spotify.com/artist.jpg' }],
                external_urls: {} // Empty external_urls
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No URL Artist',
          image_url: 'http://spotify.com/artist.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No URL Song');
    });

    it('should handle Spotify track without preview_url', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOPREVIEW123',
            title: 'No Preview Song',
            subtitle: 'No Preview Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Classical' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No Preview Song',
                album: {
                  name: 'No Preview Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 300000,
                // No preview_url
                external_urls: {
                  spotify: 'http://spotify.com/track/nopreview'
                },
                uri: 'spotify:track:nopreview'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Preview Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No Preview Song');
    });

    it('should handle Spotify track without album images', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOALBUMIMG456',
            title: 'No Album Image Song',
            subtitle: 'No Album Image Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No Album Image Song',
                album: {
                  name: 'No Album Image Album',
                  images: [] // Empty images array
                },
                duration_ms: 250000,
                preview_url: 'http://spotify.com/preview.mp3',
                external_urls: {
                  spotify: 'http://spotify.com/track/noalbumimg'
                },
                uri: 'spotify:track:noalbumimg'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Album Image Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No Album Image Song');
    });

    it('should handle combinations of missing optional Spotify fields', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'MINIMAL999',
            title: 'Minimal Spotify Song',
            subtitle: 'Minimal Spotify Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Folk' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Minimal Spotify Song',
                album: {
                  name: 'Minimal Album'
                  // No images
                },
                duration_ms: 180000,
                // No preview_url
                external_urls: {
                  spotify: 'http://spotify.com/track/minimal'
                },
                uri: 'spotify:track:minimal'
              }
            ]
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Minimal Spotify Artist',
                images: [],
                external_urls: {}
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get
        .mockResolvedValueOnce(mockSpotifyTrackResponse)
        .mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Minimal Spotify Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Minimal Spotify Song');
      expect(response.body.album).toBe('Minimal Album');
    });

    it('should handle Spotify artist search error with specific error message', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'ERRMSG123',
            title: 'Error Message Song',
            subtitle: 'Error Message Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const spotifyError = new Error('Network error: Failed to connect');
      spotifyError.response = {
        status: 500,
        data: { error: 'Internal Server Error' }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockRejectedValueOnce(spotifyError);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Error Message Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Error Message Song');
    });

    it('should handle Spotify track search error with specific error message', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'TRACKERR456',
            title: 'Track Error Song',
            subtitle: 'Track Error Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      const trackError = new Error('Spotify track search failed');
      trackError.response = {
        status: 503,
        data: { error: 'Service Unavailable' }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get
        .mockRejectedValueOnce(trackError)
        .mockRejectedValueOnce(new Error('Artist search also failed'));

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Track Error Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Track Error Song');
    });

    it('should handle Spotify artist with images array but first item without url', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOURL789',
            title: 'No URL Song',
            subtitle: 'No URL Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'No URL Artist',
                images: [
                  { height: 640, width: 640 } // Image object without url field
                ],
                external_urls: {
                  spotify: 'http://spotify.com/artist'
                }
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No URL Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No URL Song');
    });

    it('should handle Spotify track with album but no name field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOALBUMNAME321',
            title: 'No Album Name Song',
            subtitle: 'No Album Name Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Electronic' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No Album Name Song',
                album: {
                  // No name field
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 200000,
                external_urls: {
                  spotify: 'http://spotify.com/track'
                },
                uri: 'spotify:track:123'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Album Name Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.album).toBe('Unknown Album');
    });

    it('should handle Spotify track without external_urls', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOEXTURL654',
            title: 'No External URL Song',
            subtitle: 'No External URL Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No External URL Song',
                album: {
                  name: 'Test Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 180000,
                // No external_urls field
                uri: 'spotify:track:654'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No External URL Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.spotify_url).toBe('');
    });

    it('should handle Spotify track without uri field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOURI987',
            title: 'No URI Song',
            subtitle: 'No URI Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No URI Song',
                album: {
                  name: 'Test Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 190000,
                external_urls: {
                  spotify: 'http://spotify.com/track'
                }
                // No uri field
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No URI Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No URI Song');
    });

    it('should handle multiple missing fields in Spotify track response', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'MULTIMISSING111',
            title: 'Multi Missing Song',
            subtitle: 'Multi Missing Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Hip-Hop' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Multi Missing Song',
                album: {
                  // No name, no images
                },
                // No duration_ms
                // No external_urls
                // No uri
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Multi Missing Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.album).toBe('Unknown Album');
      expect(response.body.spotify_url).toBe('');
    });

    it('should handle Spotify responses with null values', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NULLVALS222',
            title: 'Null Values Song',
            subtitle: 'Null Values Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Null Values Artist',
                images: null, // Explicitly null
                external_urls: null // Explicitly null
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Null Values Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Null Values Song');
    });

    it('should handle Spotify track with undefined album', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOALBUM333',
            title: 'No Album Song',
            subtitle: 'No Album Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No Album Song',
                // No album field at all
                duration_ms: 210000,
                external_urls: {
                  spotify: 'http://spotify.com/track'
                },
                uri: 'spotify:track:333'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Album Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.album).toBe('Unknown Album');
    });

    it('should handle Spotify track with external_urls as empty object', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EMPTYEXT444',
            title: 'Empty External Song',
            subtitle: 'Empty External Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Empty External Song',
                album: {
                  name: 'Test Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 200000,
                external_urls: {}, // Empty object, no spotify field
                uri: 'spotify:track:444'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Empty External Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.spotify_url).toBe('');
    });

    it('should handle Spotify artist with external_urls as empty object', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'ARTISTEMPTY555',
            title: 'Artist Empty External Song',
            subtitle: 'Artist Empty External Name',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Artist Empty External Name',
                images: [{ url: 'http://spotify.com/artist.jpg' }],
                external_urls: {} // Empty object, no spotify field
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Artist Empty External Name',
          image_url: 'http://spotify.com/artist.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Artist Empty External Song');
    });

    it('should handle Shazam response with images.coverart but no coverarthq', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'COVERART666',
            title: 'Cover Art Song',
            subtitle: 'Cover Art Artist',
            images: {
              coverart: 'http://example.com/coverart.jpg' // coverart instead of coverarthq
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Cover Art Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.cover_art_url).toBe('http://example.com/coverart.jpg');
    });

    it('should handle track.hub.actions with applemusicplay type', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'APPLEPLAY777',
            title: 'Apple Play Song',
            subtitle: 'Apple Play Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'applemusicplay',
                  id: 'appleid777'
                }
              ]
            },
            genres: { primary: 'Electronic' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Apple Play Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toContain('appleid777');
    });

    it('should handle track.hub.actions without type but with name=apple', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'APPLENAME888',
            title: 'Apple Name Song',
            subtitle: 'Apple Name Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  name: 'apple',
                  id: 'appleid888'
                }
              ]
            },
            genres: { primary: 'Country' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Apple Name Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toContain('appleid888');
    });

    it('should handle track.hub.actions with uri type for preview', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'URITYPE999',
            title: 'URI Type Song',
            subtitle: 'URI Type Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'uri',
                  uri: 'http://preview.example.com/song.mp3'
                }
              ]
            },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'URI Type Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.preview_url).toBe('http://preview.example.com/song.mp3');
    });

    it('should handle track.hub without actions array', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOHUBACTIONS000',
            title: 'No Hub Actions Song',
            subtitle: 'No Hub Actions Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {}, // hub exists but no actions
            genres: { primary: 'Rock' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Hub Actions Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toBe('');
      expect(response.body.preview_url).toBe('');
    });

    it('should handle track without hub at all', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOHUB111',
            title: 'No Hub Song',
            subtitle: 'No Hub Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            // No hub at all
            genres: { primary: 'Hip-Hop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Hub Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toBe('');
      expect(response.body.preview_url).toBe('');
    });

    it('should handle track without genres at all', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOGENRE222',
            title: 'No Genre Song',
            subtitle: 'No Genre Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] }
            // No genres at all
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Genre Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.genre).toBe('Unknown');
    });

    it('should handle track.genres without primary field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOPRIMARY333',
            title: 'No Primary Genre Song',
            subtitle: 'No Primary Genre Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: {} // genres exists but no primary field
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Primary Genre Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.genre).toBe('Unknown');
    });

    it('should handle track with images.background field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'BACKGROUND444',
            title: 'Background Image Song',
            subtitle: 'Background Image Artist',
            images: {
              background: 'http://example.com/background.jpg' // background instead of coverarthq
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Background Image Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Background Image Song');
    });

    it('should handle artists separated by comma', async () => {
      const songId = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'COMMA555',
            title: 'Comma Artists Song',
            subtitle: 'Artist One, Artist Two',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      mockArtistsCollection.insertOne
        .mockResolvedValueOnce({ insertedId: artist1Id })
        .mockResolvedValueOnce({ insertedId: artist2Id });

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { _id: artist1Id, name: 'Artist One', image_url: '' },
          { _id: artist2Id, name: 'Artist Two', image_url: '' }
        ])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.artist).toContain('Artist One');
      expect(response.body.artist).toContain('Artist Two');
    });

    it('should handle Spotify track with duration_ms=0', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'ZERO666',
            title: 'Zero Duration Song',
            subtitle: 'Zero Duration Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Zero Duration Song',
                album: {
                  name: 'Test Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 0, // Zero duration
                external_urls: {
                  spotify: 'http://spotify.com/track'
                },
                uri: 'spotify:track:666'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Zero Duration Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.duration_ms).toBe(0);
    });

    it('should handle track without isrc field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            // No isrc field
            title: 'No ISRC Song',
            subtitle: 'No ISRC Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No ISRC Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.isrc).toBe('');
    });

    it('should handle track without title field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOTITLE777',
            // No title field
            subtitle: 'Title Missing Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Title Missing Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Unknown');
    });

    it('should handle track without subtitle field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOSUBTITLE888',
            title: 'No Subtitle Song',
            // No subtitle field
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Electronic' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Unknown Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.artist).toBe('Unknown Artist');
    });

    it('should handle artist separation with mixed delimiters', async () => {
      const songId = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();
      const artist3Id = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'MIXED999',
            title: 'Mixed Delimiters Song',
            subtitle: 'Artist One, Artist Two & Artist Three',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      mockArtistsCollection.insertOne
        .mockResolvedValueOnce({ insertedId: artist1Id })
        .mockResolvedValueOnce({ insertedId: artist2Id })
        .mockResolvedValueOnce({ insertedId: artist3Id });

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { _id: artist1Id, name: 'Artist One', image_url: '' },
          { _id: artist2Id, name: 'Artist Two', image_url: '' },
          { _id: artist3Id, name: 'Artist Three', image_url: '' }
        ])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.artist_ids.length).toBe(3);
    });

    it('should handle empty string in artist names after splitting', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EMPTYARTIST000',
            title: 'Empty Artist Names Song',
            subtitle: 'Valid Artist, , & ',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Valid Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.artist_ids.length).toBe(1);
    });

    it('should handle Spotify artist with background image from Shazam', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'BGIMG111',
            title: 'Background Image Song',
            subtitle: 'Background Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg',
              background: 'http://example.com/background.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [] // No Spotify artist found, should use Shazam background
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Background Artist',
          image_url: 'http://example.com/background.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Background Image Song');
    });

    it('should handle applemusicplay action without id field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOAPPLEID222',
            title: 'No Apple ID Song',
            subtitle: 'No Apple ID Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'applemusicplay'
                  // No id field
                }
              ]
            },
            genres: { primary: 'Pop' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Apple ID Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toBe('');
    });

    it('should handle uri action without uri field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NOURI333',
            title: 'No URI Field Song',
            subtitle: 'No URI Field Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  type: 'uri'
                  // No uri field
                }
              ]
            },
            genres: { primary: 'Rock' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No URI Field Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.preview_url).toBe('');
    });

    it('should handle apple action without id field', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'APPLENO444',
            title: 'Apple No ID Song',
            subtitle: 'Apple No ID Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: {
              actions: [
                {
                  name: 'apple'
                  // No id field
                }
              ]
            },
            genres: { primary: 'Jazz' }
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Apple No ID Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.apple_music_url).toBe('');
    });

    it('should handle Spotify track without duration_ms', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'NODURATION555',
            title: 'No Duration Song',
            subtitle: 'No Duration Artist',
            images: {
              coverarthq: 'http://example.com/cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Electronic' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'No Duration Song',
                album: {
                  name: 'Test Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                // No duration_ms field
                external_urls: {
                  spotify: 'http://spotify.com/track'
                },
                uri: 'spotify:track:555'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'No Duration Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.duration_ms).toBe(0);
    });

    it('should use Spotify track data when available over Shazam data', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'PREFER666',
            title: 'Preference Test Song',
            subtitle: 'Preference Test Artist',
            images: {
              coverarthq: 'http://example.com/shazam-cover.jpg'
            },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [
              {
                name: 'Preference Test Song',
                album: {
                  name: 'Spotify Album',
                  images: [{ url: 'http://spotify.com/album.jpg' }]
                },
                duration_ms: 250000,
                external_urls: {
                  spotify: 'http://spotify.com/track/pref'
                },
                uri: 'spotify:track:pref666'
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Preference Test Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.album).toBe('Spotify Album');
      expect(response.body.duration_ms).toBe(250000);
      expect(response.body.spotify_url).toBe('http://spotify.com/track/pref');
    });

    it('should handle Spotify artist response with empty artists object', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EMPTYARTOBJ777',
            title: 'Empty Artist Object Song',
            subtitle: 'Empty Artist Object Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Spotify returns { artists: {} } instead of { artists: { items: [] } }
      const mockSpotifyArtistResponse = {
        data: {
          artists: {} // No items property
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Empty Artist Object Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Empty Artist Object Song');
    });

    it('should handle Spotify track response with empty tracks object', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EMPTYTRACKOBJ888',
            title: 'Empty Track Object Song',
            subtitle: 'Empty Track Object Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Spotify returns { tracks: {} } instead of { tracks: { items: [] } }
      const mockSpotifyTrackResponse = {
        data: {
          tracks: {} // No items property
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Empty Track Object Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Empty Track Object Song');
    });

    it('should handle Spotify artist search with zero-length items array', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'ZEROLENGTH000',
            title: 'Zero Length Artist Array',
            subtitle: 'Zero Length Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Spotify returns valid structure but items array is EMPTY (length 0)
      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [] // Empty array - this triggers "return null" at line 258
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Zero Length Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Zero Length Artist Array');
    });

    it('should handle Spotify track search with zero-length items array', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'ZEROTRACK111',
            title: 'Zero Track Length Song',
            subtitle: 'Zero Track Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Spotify track returns valid structure but empty items array
      const mockSpotifyTrackResponse = {
        data: {
          tracks: {
            items: [] // Empty array - should trigger fallback
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyTrackResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Zero Track Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Zero Track Length Song');
    });

    it('should handle track without ISRC and valid Spotify artist with images', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            // NO ISRC field
            title: 'No ISRC Valid Artist',
            subtitle: 'Valid Spotify Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      // Since no ISRC, searchSpotifyTrack should be skipped
      // Only searchSpotifyArtist should be called
      const mockSpotifyArtistResponse = {
        data: {
          artists: {
            items: [
              {
                name: 'Valid Spotify Artist',
                images: [{ url: 'http://spotify.com/artist-valid.jpg' }],
                external_urls: { spotify: 'http://spotify.com/artist/valid' }
              }
            ]
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      axios.get.mockResolvedValueOnce(mockSpotifyArtistResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Valid Spotify Artist',
          image_url: 'http://spotify.com/artist-valid.jpg'
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No ISRC Valid Artist');
      expect(response.body.artist).toBe('Valid Spotify Artist');
    });

    it('should handle track without ISRC and empty Spotify artist results', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            // NO ISRC field - this will skip searchSpotifyTrack
            title: 'No ISRC Empty Artist',
            subtitle: 'Empty Result Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Jazz' }
          }
        }
      };

      // Since no ISRC, ONLY searchSpotifyArtist is called
      // This should return empty array and hit line 258 (return null)
      const mockSpotifyArtistEmptyResponse = {
        data: {
          artists: {
            items: [] // Empty array - THIS should trigger line 258!
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      // Only ONE axios.get call for artist search (no ISRC = no track search)
      axios.get.mockResolvedValueOnce(mockSpotifyArtistEmptyResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Empty Result Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('No ISRC Empty Artist');
      expect(response.body.artist).toBe('Empty Result Artist');
    });

    it('should handle track with ISRC but empty Spotify track results', async () => {
      const songId = new ObjectId();
      const artistId = new ObjectId();

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EMPTYTRACK999',
            title: 'Empty Spotify Track',
            subtitle: 'Empty Track Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Rock' }
          }
        }
      };

      // Spotify track search returns empty array
      const mockSpotifyTrackEmptyResponse = {
        data: {
          tracks: {
            items: [] // Empty - should return null and use Shazam data
          }
        }
      };

      // Spotify artist search also returns empty
      const mockSpotifyArtistEmptyResponse = {
        data: {
          artists: {
            items: []
          }
        }
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);
      // First axios.get for track search (empty result)
      axios.get.mockResolvedValueOnce(mockSpotifyTrackEmptyResponse);
      // Second axios.get for artist search (empty result)
      axios.get.mockResolvedValueOnce(mockSpotifyArtistEmptyResponse);

      mockArtistsCollection.findOne.mockResolvedValue(null);
      mockArtistsCollection.insertOne.mockResolvedValue({ insertedId: artistId });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.insertOne.mockResolvedValue({ insertedId: songId });
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{
          _id: artistId,
          name: 'Empty Track Artist',
          image_url: ''
        }])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Empty Spotify Track');
    });

    it('should return existing song with artist population when artist_ids present', async () => {
      // Test line 584-593: When song already exists in DB with artist_ids
      const existingArtistId = new ObjectId('68f5e71e3bfc6116faa19001');
      const existingSongId = new ObjectId('68f5e71e3bfc6116faa19002');

      const mockShazamResponse = {
        data: {
          track: {
            isrc: 'EXISTINGSONG123',
            title: 'Existing Song',
            subtitle: 'Existing Artist',
            images: { coverarthq: 'http://example.com/cover.jpg' },
            hub: { actions: [] },
            genres: { primary: 'Pop' }
          }
        }
      };

      const mockExistingSong = {
        _id: existingSongId,
        isrc: 'EXISTINGSONG123',
        title: 'Existing Song',
        artist_subtitle: 'Existing Artist',
        artist_ids: [existingArtistId],
        cover_art_url: 'http://example.com/cover.jpg',
        duration_ms: 200000,
        spotify_url: 'http://spotify.com/track/existing',
        spotify_uri: 'spotify:track:existing123',
        apple_music_url: 'http://music.apple.com/existing',
        preview_url: 'http://preview.mp3',
        genre: 'Pop',
        release_date: '2023-01-01'
      };

      const mockExistingArtist = {
        _id: existingArtistId,
        name: 'Existing Artist',
        image_url: 'http://artist-image.jpg'
      };

      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      axios.mockResolvedValueOnce(mockShazamResponse);

      mockSongsCollection.findOne.mockResolvedValue(mockExistingSong);
      mockArtistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockExistingArtist])
      });

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Existing Song');
      expect(response.body.artist).toBe('Existing Artist');
      expect(response.body.artist_image_url).toBe('http://artist-image.jpg');
      expect(mockArtistsCollection.find).toHaveBeenCalledWith({ 
        _id: { $in: [existingArtistId] } 
      });
    });

    it('should handle Shazam API error with response status and message', async () => {
      // Test line 622: error.response.status path in Shazam API error
      const shazamError = new Error('Shazam API failed');
      shazamError.response = {
        status: 503,
        data: {
          message: 'Service temporarily unavailable'
        }
      };

      // Mock axios.post for Spotify token (first call) - SUCCESS
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });
      
      // Mock axios.mockResolvedValueOnce for Shazam API (first axios call after post) - REJECT with error
      axios.mockRejectedValueOnce(shazamError);

      const response = await request(app)
        .post('/songs/recognize')
        .attach('audio', Buffer.from('fake audio data'), 'test.mp3');

      expect(response.status).toBe(503);
      expect(response.body.message).toBe('Failed to recognize song');
      expect(response.body.error).toBe('Service temporarily unavailable');
    });
  });
});
