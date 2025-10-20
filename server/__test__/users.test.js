const request = require('supertest');
const app = require('../app');
const { getDB } = require('../config/mongodb');

// Mock MongoDB connection
jest.mock('../config/mongodb', () => ({
  getDB: jest.fn()
}));

describe('Users API Endpoints', () => {
  let mockDb;
  let mockUsersCollection;

  beforeAll(() => {
    // Setup mock database
    mockUsersCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn()
    };

    mockDb = {
      collection: jest.fn((name) => {
        if (name === 'users') return mockUsersCollection;
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

  describe('POST /users - Create/Get User', () => {
    it('should create a new user when device_id does not exist', async () => {
      const newUser = {
        device_id: 'test-device-123',
        is_anonymous: true,
        search_history: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockUsersCollection.findOne.mockResolvedValue(null);
      mockUsersCollection.insertOne.mockResolvedValue({
        insertedId: 'mock-user-id-123'
      });

      const response = await request(app)
        .post('/users')
        .send({ device_id: 'test-device-123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('user_id');
      expect(response.body.device_id).toBe('test-device-123');
      expect(response.body.is_anonymous).toBe(true);
      expect(response.body.search_history).toEqual([]);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({
        device_id: 'test-device-123'
      });
      expect(mockUsersCollection.insertOne).toHaveBeenCalled();
    });

    it('should return existing user when device_id already exists', async () => {
      const existingUser = {
        _id: 'existing-user-id',
        device_id: 'existing-device-123',
        is_anonymous: true,
        search_history: ['song1', 'song2'],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockUsersCollection.findOne.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/users')
        .send({ device_id: 'existing-device-123' });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe('existing-user-id');
      expect(response.body.device_id).toBe('existing-device-123');
      expect(response.body.search_history).toHaveLength(2);
      expect(mockUsersCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should create user with empty search_history array', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);
      mockUsersCollection.insertOne.mockResolvedValue({
        insertedId: 'new-user-id'
      });

      const response = await request(app)
        .post('/users')
        .send({ device_id: 'new-device-456' });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.search_history)).toBe(true);
      expect(response.body.search_history).toHaveLength(0);
    });

    it('should handle database findOne errors', async () => {
      mockUsersCollection.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/users')
        .send({ device_id: 'test-device-error' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle database insertOne errors', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);
      mockUsersCollection.insertOne.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/users')
        .send({ device_id: 'test-device-error' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users/search-history - Add Song to Search History', () => {
    it('should return 400 if song_id is missing', async () => {
      const mockUser = {
        _id: 'user-id-123',
        device_id: 'test-device-123',
        search_history: []
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('song_id is required');
    });

    it('should return 400 if song_id is empty string', async () => {
      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('song_id is required');
    });

    it('should return 404 if song is not found', async () => {
      const { ObjectId } = require('mongodb');
      
      const mockUser = {
        _id: new ObjectId(),
        device_id: 'test-device-123',
        search_history: []
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      let callCount = 0;
      mockUsersCollection.findOne.mockImplementation(() => {
        callCount++;
        return Promise.resolve(mockUser);
      });

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Song not found');
    });

    it('should add song to search history successfully', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockSong = {
        _id: songId,
        title: 'Test Song',
        artist_subtitle: 'Test Artist',
        cover_art_url: 'https://cover.jpg'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search history updated');
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $set: { search_history: [songId.toString()] } }
      );
    });

    it('should add song to existing search history', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();
      const userId = new ObjectId();

      const mockSong = {
        _id: songId2,
        title: 'New Song'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId1.toString()]
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId2.toString() });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search history updated');
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $set: { search_history: [songId1.toString(), songId2.toString()] } }
      );
    });

    it('should return message if song already in history', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();
      const songIdStr = songId.toString();

      const mockSong = {
        _id: songId,
        title: 'Test Song'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songIdStr]
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songIdStr });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Song already in search history');
      expect(mockUsersCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should handle user not found after song validation', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();

      const mockSong = {
        _id: songId,
        title: 'Test Song'
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      // First call returns null (user not found)
      mockUsersCollection.findOne.mockResolvedValue(null);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId.toString() });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: 'invalid-object-id' });

      // When ObjectId conversion fails for song lookup, it catches error
      // and proceeds to check user, which also fails with invalid ObjectId
      // So it returns 404 "User not found"
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should handle database updateOne errors', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockSong = {
        _id: songId,
        title: 'Test Song'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockRejectedValue(new Error('Update failed'));

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId.toString() });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle user with null search_history', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockSong = {
        _id: songId,
        title: 'Test Song'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: null // Explicitly null
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search history updated');
      // When search_history is null, it should be treated as empty array
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $set: { search_history: [songId.toString()] } }
      );
    });

    it('should handle user with undefined search_history', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockSong = {
        _id: songId,
        title: 'Test Song'
      };

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123'
        // search_history is undefined (not set)
      };

      const mockSongsCollection = {
        findOne: jest.fn().mockResolvedValue(mockSong)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      mockDb.collection.mockImplementation((name) => {
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .post('/users/search-history')
        .set('x-device-id', 'test-device-123')
        .send({ song_id: songId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search history updated');
      // When search_history is undefined, it should be treated as empty array
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $set: { search_history: [songId.toString()] } }
      );
    });
  });

  describe('GET /users/search-history - Get Search History', () => {
    it('should return user search history with populated songs (new format - artist_ids)', async () => {
      const { ObjectId } = require('mongodb');
      
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [song1Id.toString(), song2Id.toString()]
      };

      const mockSongs = [
        {
          _id: song1Id,
          title: 'Song 1',
          artist_subtitle: 'Artist 1, Featured Artist',
          artist_ids: [artist1Id, artist2Id],
          cover_art_url: 'url1',
          isrc: 'ISRC001',
          album: 'Album 1',
          duration_ms: 180000,
          spotify_url: 'https://spotify.com/1',
          genre: 'Pop'
        },
        {
          _id: song2Id,
          title: 'Song 2',
          artist_subtitle: 'Artist 2',
          artist_ids: [artist2Id],
          cover_art_url: 'url2',
          isrc: 'ISRC002',
          album: 'Album 2',
          duration_ms: 200000
        }
      ];

      const mockArtists = [
        {
          _id: artist1Id,
          name: 'Artist 1',
          image_url: 'artist-url-1'
        },
        {
          _id: artist2Id,
          name: 'Artist 2',
          image_url: 'artist-url-2'
        }
      ];

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn()
            .mockResolvedValueOnce([mockArtists[0], mockArtists[1]]) // For song 1
            .mockResolvedValueOnce([mockArtists[1]]) // For song 2
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('search_history');
      expect(Array.isArray(response.body.search_history)).toBe(true);
      expect(response.body.search_history).toHaveLength(2);
      expect(response.body.search_history[0]).toHaveProperty('title', 'Song 1');
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Artist 1, Featured Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', 'artist-url-1');
    });

    it('should handle old format songs with single artist_id', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Old Format Song',
        artist_id: artistId, // Old format
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockArtist = {
        _id: artistId,
        name: 'Single Artist',
        image_url: 'artist-image'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        findOne: jest.fn().mockResolvedValue(mockArtist)
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history).toHaveLength(1);
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Single Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', 'artist-image');
    });

    it('should handle songs with no artist info', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Song Without Artist',
        cover_art_url: 'url'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', '');
    });

    it('should return empty search history when user has no history', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history).toEqual([]);
    });

    it('should return 404 if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'non-existent-device');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle database errors when fetching songs', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song-id']
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle songs with empty artist_ids array', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Song With Empty Artists',
        artist_ids: [], // Empty array
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', '');
    });

    it('should handle songs with artist_subtitle but no artist found in DB', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Song With Subtitle',
        artist_subtitle: 'Artist From Shazam',
        artist_ids: [artistId],
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]) // No artists found
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      // Should use artist_subtitle even if artists array is empty
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Artist From Shazam');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', '');
    });

    it('should handle old format song with artist_id but artist not found', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Old Format Song',
        artist_id: artistId, // Old format
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        findOne: jest.fn().mockResolvedValue(null) // Artist not found
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', '');
    });

    it('should handle mixed song formats (old and new) in history', async () => {
      const { ObjectId } = require('mongodb');
      
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [song1Id.toString(), song2Id.toString()]
      };

      const mockSongs = [
        {
          _id: song1Id,
          title: 'New Format Song',
          artist_ids: [artist1Id],
          artist_subtitle: 'New Artist',
          cover_art_url: 'url1',
          album: 'Album 1'
        },
        {
          _id: song2Id,
          title: 'Old Format Song',
          artist_id: artist2Id, // Old format
          cover_art_url: 'url2',
          album: 'Album 2'
        }
      ];

      const mockArtist1 = {
        _id: artist1Id,
        name: 'New Artist',
        image_url: 'new-artist-image'
      };

      const mockArtist2 = {
        _id: artist2Id,
        name: 'Old Artist',
        image_url: 'old-artist-image'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn()
            .mockResolvedValueOnce([mockArtist1]) // For new format song
            .mockResolvedValueOnce([]) // For old format song
        }),
        findOne: jest.fn().mockResolvedValue(mockArtist2) // For old format lookup
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history).toHaveLength(2);
      // New format song
      expect(response.body.search_history[0]).toHaveProperty('artist', 'New Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', 'new-artist-image');
      // Old format song
      expect(response.body.search_history[1]).toHaveProperty('artist', 'Old Artist');
      expect(response.body.search_history[1]).toHaveProperty('artist_image_url', 'old-artist-image');
    });

    it('should populate all song fields correctly including optional fields', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        isrc: 'ISRC123',
        title: 'Complete Song',
        artist_ids: [artistId],
        artist_subtitle: 'Test Artist',
        album: 'Test Album',
        cover_art_url: 'https://cover.jpg',
        duration_ms: 180000,
        spotify_url: 'https://spotify.com/track',
        apple_music_url: 'https://music.apple.com/track',
        preview_url: 'https://preview.mp3',
        youtube_url: 'https://youtube.com/watch',
        genre: 'Pop',
        release_date: '2023-01-01'
      };

      const mockArtist = {
        _id: artistId,
        name: 'Test Artist',
        image_url: 'https://artist.jpg'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockArtist])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      const song = response.body.search_history[0];
      expect(song).toHaveProperty('_id');
      expect(song).toHaveProperty('isrc', 'ISRC123');
      expect(song).toHaveProperty('title', 'Complete Song');
      expect(song).toHaveProperty('artist', 'Test Artist');
      expect(song).toHaveProperty('artist_image_url', 'https://artist.jpg');
      expect(song).toHaveProperty('album', 'Test Album');
      expect(song).toHaveProperty('cover_art_url', 'https://cover.jpg');
      expect(song).toHaveProperty('duration_ms', 180000);
      expect(song).toHaveProperty('spotify_url', 'https://spotify.com/track');
      expect(song).toHaveProperty('apple_music_url', 'https://music.apple.com/track');
      expect(song).toHaveProperty('preview_url', 'https://preview.mp3');
      expect(song).toHaveProperty('youtube', 'https://youtube.com/watch');
      expect(song).toHaveProperty('genre', 'Pop');
      expect(song).toHaveProperty('release_date', '2023-01-01');
    });

    it('should use artistData names when artist_subtitle is not available', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Song Without Subtitle',
        artist_ids: [artist1Id, artist2Id],
        // No artist_subtitle field
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockArtists = [
        {
          _id: artist1Id,
          name: 'Artist One',
          image_url: 'artist1.jpg'
        },
        {
          _id: artist2Id,
          name: 'Artist Two',
          image_url: 'artist2.jpg'
        }
      ];

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockArtists)
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      // Should use joined artist names when subtitle not available
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Artist One, Artist Two');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', 'artist1.jpg');
    });

    it('should handle artists without image_url', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Song Test',
        artist_ids: [artistId],
        artist_subtitle: 'Test Artist',
        cover_art_url: 'url',
        album: 'Album'
      };

      const mockArtist = {
        _id: artistId,
        name: 'Test Artist'
        // No image_url field
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockArtist])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.search_history[0]).toHaveProperty('artist', 'Test Artist');
      expect(response.body.search_history[0]).toHaveProperty('artist_image_url', ''); // Empty string
    });

    it('should handle songs with missing optional fields', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSong = {
        _id: songId,
        title: 'Minimal Song',
        artist_ids: [artistId]
        // Missing: spotify_url, apple_music_url, preview_url, youtube_url
      };

      const mockArtist = {
        _id: artistId,
        name: 'Artist'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockSong])
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockArtist])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      const song = response.body.search_history[0];
      expect(song).toHaveProperty('spotify_url', '');
      expect(song).toHaveProperty('apple_music_url', '');
      expect(song).toHaveProperty('preview_url', '');
      expect(song).toHaveProperty('youtube', '');
    });
  });

  describe('DELETE /users/search-history/:song_id - Delete History Item', () => {
    it('should delete song from history successfully', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const songId = 'song-id-123';
      
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId, 'song-id-456']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const response = await request(app)
        .delete(`/users/search-history/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Song removed from history');
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $pull: { search_history: songId } }
      );
    });

    it('should return 404 if song not found in history', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['different-song']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 0
      });

      const response = await request(app)
        .delete('/users/search-history/non-existent-song')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Song not found in history');
    });

    it('should return 404 if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/users/search-history/song-id-123')
        .set('x-device-id', 'non-existent-device');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle database updateOne errors', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song-id-123']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/users/search-history/song-id-123')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /users/search-history - Clear All History', () => {
    it('should clear all search history successfully', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song1', 'song2', 'song3']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const response = await request(app)
        .delete('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All history cleared');
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $set: { search_history: [] } }
      );
    });

    it('should handle clearing already empty history', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const response = await request(app)
        .delete('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All history cleared');
    });

    it('should return 404 if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/users/search-history')
        .set('x-device-id', 'non-existent-device');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle database updateOne errors', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song1']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /users/artists-from-history - Get Artists from History', () => {
    it('should return unique artists from search history', async () => {
      const { ObjectId } = require('mongodb');
      
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      const song3Id = new ObjectId();
      const artist1Id = new ObjectId();
      const artist2Id = new ObjectId();
      const artist3Id = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [song1Id.toString(), song2Id.toString(), song3Id.toString()]
      };

      // Songs with overlapping artists
      const mockSongs = [
        {
          _id: song1Id,
          artist_ids: [artist1Id, artist2Id] // Song 1 has Artist 1 & 2
        },
        {
          _id: song2Id,
          artist_ids: [artist2Id, artist3Id] // Song 2 has Artist 2 & 3 (Artist 2 overlaps)
        },
        {
          _id: song3Id,
          artist_ids: [artist1Id] // Song 3 has Artist 1 (overlaps with Song 1)
        }
      ];

      const mockArtists = [
        {
          _id: artist1Id,
          name: 'Artist 1',
          slug: 'artist-1',
          image_url: 'url1'
        },
        {
          _id: artist2Id,
          name: 'Artist 2',
          slug: 'artist-2',
          image_url: 'url2'
        },
        {
          _id: artist3Id,
          name: 'Artist 3',
          slug: 'artist-3',
          image_url: 'url3'
        }
      ];

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockArtists)
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('artists');
      expect(Array.isArray(response.body.artists)).toBe(true);
      expect(response.body.artists).toHaveLength(3); // Should return 3 unique artists
      expect(response.body.artists[0]).toHaveProperty('name');
      expect(response.body.artists[0]).toHaveProperty('slug');
      expect(response.body.artists[0]).toHaveProperty('image_url');
    });

    it('should handle songs with no artist_ids', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSongs = [
        {
          _id: songId,
          title: 'Song Without Artists'
          // No artist_ids field
        }
      ];

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.artists).toEqual([]);
    });

    it('should handle mixed songs (some with artists, some without)', async () => {
      const { ObjectId } = require('mongodb');
      
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [song1Id.toString(), song2Id.toString()]
      };

      const mockSongs = [
        {
          _id: song1Id,
          artist_ids: [artistId]
        },
        {
          _id: song2Id
          // No artist_ids
        }
      ];

      const mockArtist = {
        _id: artistId,
        name: 'Artist 1',
        slug: 'artist-1',
        image_url: 'url'
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockArtist])
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.artists).toHaveLength(1);
      expect(response.body.artists[0].name).toBe('Artist 1');
    });

    it('should return 404 if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'non-existent-device');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return empty array if no search history', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.artists).toEqual([]);
    });

    it('should return empty array if search_history is null', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: null
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.artists).toEqual([]);
    });

    it('should handle database errors when fetching songs', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song-id']
      };

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle database errors when fetching artists', async () => {
      const { ObjectId } = require('mongodb');
      
      const songId = new ObjectId();
      const artistId = new ObjectId();
      const userId = new ObjectId();

      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: [songId.toString()]
      };

      const mockSongs = [
        {
          _id: songId,
          artist_ids: [artistId]
        }
      ];

      const mockSongsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockSongs)
        })
      };

      const mockArtistsCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      mockDb.collection.mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'artists') return mockArtistsCollection;
        return { findOne: jest.fn() };
      });

      const response = await request(app)
        .get('/users/artists-from-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});
