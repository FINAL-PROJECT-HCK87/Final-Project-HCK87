const request = require('supertest');
const { ObjectId } = require('mongodb');
const app = require('../app');
const { getDB } = require('../config/mongodb');
const axios = require('axios');

// Mock MongoDB
jest.mock('../config/mongodb');
jest.mock('axios');

describe('Playlists API Endpoints', () => {
  let mockPlaylistsCollection;
  let mockSongsCollection;
  let mockUsersCollection;
  let mockArtistsCollection;

  beforeAll(() => {
    mockPlaylistsCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      bulkWrite: jest.fn(),
    };

    mockSongsCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      bulkWrite: jest.fn(),
    };

    mockUsersCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
    };

    mockArtistsCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      bulkWrite: jest.fn(),
    };

    getDB.mockReturnValue({
      collection: jest.fn((name) => {
        if (name === 'playlists') return mockPlaylistsCollection;
        if (name === 'songs') return mockSongsCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'artists') return mockArtistsCollection;
        return {};
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // POST /playlists/create
  describe('POST /playlists/create', () => {
    it('should create a new user playlist', async () => {
      mockPlaylistsCollection.insertOne.mockResolvedValue({
        insertedId: new ObjectId(),
        acknowledged: true,
      });

      const response = await request(app)
        .post('/playlists/create')
        .set('x-device-id', 'test-device-123')
        .send({
          playlistName: 'My Playlist',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Playlist created');
      expect(response.body).toHaveProperty('data');
    });
  });

  // GET /playlists/all
  describe('GET /playlists/all', () => {
    it('should return all user playlists', async () => {
      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Playlist 1',
          deviceIds: ['test-device-123'],
          tracks: [],
        },
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  // GET /playlists/for-you
  describe('GET /playlists/for-you', () => {
    it('should return personalized playlists', async () => {
      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [],
      });
      mockPlaylistsCollection.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockPlaylistsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  // GET /playlists/:playlist_id
  describe('GET /playlists/:playlist_id', () => {
    it('should return playlist details', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        playlist_name: 'Test Playlist',
        tracks: [],
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
    });
  });

  // PUT /playlists/:playlist_id
  describe('PUT /playlists/:playlist_id', () => {
    it('should add song to playlist', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [],
        deviceIds: ['test-device-123'],
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: songId.toString() },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Song added successfully');
    });

    it('should return 500 if songData._id is missing (no validation)', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [],
      });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({});

      expect(response.status).toBe(500);
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: new ObjectId().toString() },
        });

      expect(response.status).toBe(404);
    });
  });

  // DELETE /playlists/:playlist_id
  describe('DELETE /playlists/:playlist_id', () => {
    it('should delete playlist successfully', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Playlist deleted');
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
    });
  });

  // POST /playlists/:playlist_id/share
  describe('POST /playlists/:playlist_id/share', () => {
    it('should share playlist with another device', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['owner-device'],
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .set('x-device-id', 'test-device-123')
        .send({
          target_device_id: 'target-device-456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Device added to playlist successfully');
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .set('x-device-id', 'test-device-123')
        .send({
          target_device_id: 'target-device-456',
        });

      expect(response.status).toBe(404);
    });
  });

  // DELETE /playlists/:playlist_id/leave
  describe('DELETE /playlists/:playlist_id/leave', () => {
    it('should leave shared playlist successfully', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['owner-device', 'test-device-123'],
        ownerId: 'owner-device',
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
    });

    it('should return 400 if user is the owner', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['test-device-123'],
        ownerId: 'test-device-123',
      });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(400);
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
    });
  });

  // DELETE /playlists/:playlist_id/songs/:song_id
  describe('DELETE /playlists/:playlist_id/songs/:song_id', () => {
    it('should remove song from playlist', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        ownerId: 'test-device-123',
        tracks: [songId],
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
    });

    it('should return 403 if user is not the owner', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        ownerId: 'other-device',
        tracks: [songId],
      });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(403);
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
    });
  });
});
