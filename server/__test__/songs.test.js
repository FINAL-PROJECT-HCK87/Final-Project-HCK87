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
  });
});
