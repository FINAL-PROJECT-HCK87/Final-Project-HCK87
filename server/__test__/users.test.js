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
      expect(response.body.device_id).toBe('test-device-123');
      expect(response.body.is_anonymous).toBe(true);
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
        search_history: [],
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
      expect(mockUsersCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockUsersCollection.findOne.mockRejectedValue(new Error('Database error'));

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
        artist: 'Test Artist'
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
      expect(mockUsersCollection.updateOne).toHaveBeenCalled();
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
    });
  });

  describe('GET /users/search-history - Get Search History', () => {
    it('should return user search history with populated songs', async () => {
      const { ObjectId } = require('mongodb');
      
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
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
          artist_subtitle: 'Artist 1',
          artist_ids: [],
          cover_art_url: 'url1'
        },
        {
          _id: song2Id,
          title: 'Song 2',
          artist_subtitle: 'Artist 2',
          artist_ids: [],
          cover_art_url: 'url2'
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
        .get('/users/search-history')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('search_history');
      expect(Array.isArray(response.body.search_history)).toBe(true);
    });

    it('should return 404 if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/search-history')
        .set('x-device-id', 'non-existent-device');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('DELETE /users/search-history/:song_id - Delete History Item', () => {
    it('should delete song from history successfully', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song-id-123']
      };

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockUsersCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const response = await request(app)
        .delete('/users/search-history/song-id-123')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Song removed from history');
    });

    it('should return 404 if song not found in history', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: []
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
  });

  describe('DELETE /users/search-history - Clear All History', () => {
    it('should clear all search history successfully', async () => {
      const { ObjectId } = require('mongodb');
      
      const userId = new ObjectId();
      const mockUser = {
        _id: userId,
        device_id: 'test-device-123',
        search_history: ['song1', 'song2']
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
  });

  describe('GET /users/artists-from-history - Get Artists from History', () => {
    it('should return unique artists from search history', async () => {
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
          artist_ids: [artist1Id]
        },
        {
          _id: song2Id,
          artist_ids: [artist2Id]
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
      const mockUser = {
        _id: 'user-id-123',
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
  });
});
