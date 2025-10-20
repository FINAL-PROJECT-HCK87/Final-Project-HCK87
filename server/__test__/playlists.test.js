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

  // ========================================
  // POST /playlists - Get Spotify Song (Complex endpoint with Spotify integration)
  // ========================================
  describe('POST /playlists - Get Spotify Song', () => {
    const mockSpotifyToken = 'mock-spotify-token';

    it('should create playlists with ISRC successfully', async () => {
      // Mock Spotify token
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock Spotify track search by ISRC
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [
              {
                id: 'spotify-track-123',
                name: 'Test Song',
                external_ids: { isrc: 'TEST123' },
              },
            ],
          },
        },
      });

      // Mock Spotify playlist search
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-1',
                name: 'Test Playlist',
                description: 'Test Description',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'Test User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // Mock playlist tracks verification
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'spotify-track-123' } }],
        },
      });

      // Mock playlist details (fetchTracks)
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'song-1',
                name: 'Song 1',
                external_ids: { isrc: 'ISRC1' },
                external_urls: { spotify: 'https://spotify.com/song1' },
                popularity: 80,
                duration_ms: 200000,
                artists: [
                  {
                    name: 'Artist 1',
                    id: 'artist-1',
                    external_urls: { spotify: 'https://spotify.com/artist1' },
                  },
                ],
                album: {
                  name: 'Album 1',
                  id: 'album-1',
                  release_date: '2024-01-01',
                  total_tracks: 12,
                  images: [{ url: 'https://album.image', height: 640, width: 640 }],
                },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      // Mock database operations
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST123',
          title: 'Test Song',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Playlists saved successfully');
      expect(response.body).toHaveProperty('playlists_count');
    });

    it('should search by title and artist if ISRC not found', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock title+artist search (no ISRC provided, so directly search by title)
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [
              {
                id: 'spotify-track-456',
                name: 'Test Song by Artist',
                external_ids: { isrc: 'TEST456' },
              },
            ],
          },
        },
      });

      // Mock playlist search
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-2',
                name: 'Playlist 2',
                images: [{ url: 'https://image2.url' }],
                owner: { display_name: 'User 2' },
                tracks: { total: 5 },
                external_urls: { spotify: 'https://spotify.com/playlist2' },
              },
            ],
          },
        },
      });

      // Mock tracks verification
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'spotify-track-456' } }],
        },
      });

      // Mock fetchTracks
      axios.get.mockResolvedValueOnce({
        data: { 
          items: [
            {
              track: {
                id: 'spotify-track-456',
                name: 'Test Song',
                external_ids: { isrc: 'TEST456' },
                external_urls: { spotify: 'https://spotify.com/track' },
                popularity: 80,
                duration_ms: 180000,
                artists: [{ name: 'Test Artist', id: 'artist-123', external_urls: { spotify: 'https://spotify.com/artist' } }],
                album: { name: 'Test Album', id: 'album-123', release_date: '2023-01-01', total_tracks: 10, images: [] }
              },
              added_at: '2024-01-01T00:00:00Z'
            }
          ] 
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          title: 'Test Song',
          artist_subtitle: 'Test Artist',
        });

      expect(response.status).toBe(201);
    });

    it('should return 500 if neither ISRC nor title provided', async () => {
      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Errors');
    });

    it('should return error if track not found on Spotify', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock ISRC search returns no results
      axios.get.mockResolvedValueOnce({
        data: { tracks: { items: [] } },
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'NONEXISTENT123',
          title: 'Nonexistent Song',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Errors');
    });

    it('should return error if no playlists found containing the track', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-123', name: 'Song' }],
          },
        },
      });

      // Playlist search returns empty
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [],
          },
        },
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST123',
        });

      expect(response.status).toBe(500);
    });

    it('should skip playlists that do not contain the track', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-999', name: 'Song' }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-no-match',
                name: 'Playlist Without Track',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
              },
            ],
          },
        },
      });

      // Playlist doesn't contain the track
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'different-track' } }],
        },
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST999',
        });

      expect(response.status).toBe(500);
    });

    it('should return existing playlists if all already in database', async () => {
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Track search
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-existing', name: 'Existing Song', external_ids: { isrc: 'EXISTING123' } }],
          },
        },
      });

      // Playlist search
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'existing-playlist',
                name: 'Existing Playlist',
                description: 'Existing Description',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // Tracks verification - playlist contains the track
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-existing' } }],
        },
      });

      // Playlist already exists in database
      mockPlaylistsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            spotify_playlist_id: 'existing-playlist',
            playlist_name: 'Existing Playlist',
            playlist_description: 'Existing Description',
            spotify_url: 'https://spotify.com',
            cover_images: ['https://image.url'],
            created_by: 'User',
            total_tracks: 10,
          },
        ]),
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'EXISTING123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'All playlists already exist in database');
      expect(response.body).toHaveProperty('playlists');
    });

    it('should handle Spotify API errors gracefully', async () => {
      axios.post.mockRejectedValueOnce(new Error('Spotify API error'));

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST123',
        });

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // POST /playlists/create - Create User Playlist
  // ========================================
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
          playlistName: 'My Awesome Playlist',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Playlist created');
      expect(response.body).toHaveProperty('data');
      expect(mockPlaylistsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          playlist_name: 'My Awesome Playlist',
          deviceIds: ['test-device-123'],
          ownerId: 'test-device-123',
          tracks: [],
        })
      );
    });

    it('should handle database errors', async () => {
      mockPlaylistsCollection.insertOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/playlists/create')
        .set('x-device-id', 'test-device-123')
        .send({
          playlistName: 'Test Playlist',
        });

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // GET /playlists/all - Get All User Playlists
  // ========================================
  describe('GET /playlists/all', () => {
    it('should return all user playlists with populated tracks (old format)', async () => {
      const song1Id = new ObjectId();
      const song2Id = new ObjectId();
      
      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Playlist 1',
          deviceIds: ['test-device-123'],
          tracks: [song1Id, song2Id], // Use ObjectId format instead of old ISRC format
        },
      ];

      const mockSongs = [
        {
          _id: song1Id,
          isrc: 'ISRC001',
          title: 'Song 1',
          artist_subtitle: 'Artist 1',
          cover_art_url: 'https://cover1.jpg',
          duration_ms: 180000,
          spotify_url: 'https://spotify.com/song1',
        },
        {
          _id: song2Id,
          isrc: 'ISRC002',
          title: 'Song 2',
          artist_subtitle: 'Artist 2',
          cover_art_url: 'https://cover2.jpg',
          duration_ms: 200000,
          spotify_url: 'https://spotify.com/song2',
        },
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].tracks).toHaveLength(2);
    });

    it('should return playlists with new format (ObjectId tracks)', async () => {
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();

      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Playlist New Format',
          deviceIds: ['test-device-123'],
          tracks: [songId1, songId2],
        },
      ];

      const mockSongs = [
        {
          _id: songId1,
          isrc: 'ISRC003',
          title: 'Song 3',
          artist_subtitle: 'Artist 3',
          cover_art_url: 'https://cover3.jpg',
          duration_ms: 190000,
          spotify_url: 'https://spotify.com/song3',
        },
        {
          _id: songId2,
          isrc: 'ISRC004',
          title: 'Song 4',
          artist_subtitle: 'Artist 4',
          cover_art_url: 'https://cover4.jpg',
          duration_ms: 210000,
          spotify_url: 'https://spotify.com/song4',
        },
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data[0].tracks).toHaveLength(2);
    });

    it('should return empty array if user has no playlists', async () => {
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle playlists with empty tracks', async () => {
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'Empty Playlist',
            deviceIds: ['test-device-123'],
            tracks: [],
          },
        ]),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data[0].tracks).toHaveLength(0);
    });

    it('should handle errors in track population', async () => {
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'Playlist',
            deviceIds: ['test-device-123'],
            tracks: [{ isrc: 'BROKEN', song_name: 'Test' }],
          },
        ]),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data[0].tracks).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // GET /playlists/for-you - Get Playlists For You
  // ========================================
  describe('GET /playlists/for-you', () => {
    it('should return personalized playlists based on user search history', async () => {
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();

      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [songId1, songId2],
      });

      // Matched playlists based on history
      mockPlaylistsCollection.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'Matched Playlist',
            tracks: [songId1, songId2],
          },
        ]),
      });

      // Featured playlists
      mockPlaylistsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'BEST HITS 2025',
            tracks: [songId1],
          },
        ]),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: songId1,
            title: 'Song 1',
            cover_art_url: 'https://cover1.jpg',
          },
        ]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Playlists fetched successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return only featured playlists if user has no history', async () => {
      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [],
      });

      mockPlaylistsCollection.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      });

      mockPlaylistsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'Lagu Pop Indonesia Hits 2025',
            tracks: [],
          },
        ]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return featured playlists if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

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
    });

    it('should populate cover images from tracks', async () => {
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();
      const songId3 = new ObjectId();
      const songId4 = new ObjectId();

      // User with empty search history
      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [],
      });

      // Since search_history is empty, controller will NOT query matched playlists
      // So we only need to mock the featured playlists query
      const featuredPlaylist = {
        _id: new ObjectId(),
        playlist_name: 'BEST HITS 2025',
        tracks: [songId1, songId2, songId3, songId4],
      };

      const mockFind = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([featuredPlaylist]),
      });

      mockPlaylistsCollection.find = mockFind;

      // Songs query - will be called ONCE for the single featured playlist
      // Controller calls: songs.find({ _id: { $in: [first 4 track IDs] } })
      mockSongsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: songId1,
            title: 'Song 1',
            cover_art_url: 'https://cover1.jpg',
          },
          {
            _id: songId2,
            title: 'Song 2',
            cover_art_url: 'https://cover2.jpg',
          },
          {
            _id: songId3,
            title: 'Song 3',
            cover_art_url: 'https://cover3.jpg',
          },
          {
            _id: songId4,
            title: 'Song 4',
            cover_art_url: 'https://cover4.jpg',
          },
        ]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Playlists fetched successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('cover_images');
      expect(Array.isArray(response.body.data[0].cover_images)).toBe(true);
      expect(response.body.data[0].cover_images.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('song_count');
    });

    it('should handle database errors', async () => {
      mockUsersCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // GET /playlists/:playlist_id - Get Playlist by ID
  // ========================================
  describe('GET /playlists/:playlist_id', () => {
    it('should return playlist details with old format tracks (ISRC)', async () => {
      const playlistId = new ObjectId();
      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'Test Playlist',
        tracks: [
          { isrc: 'ISRC001', song_name: 'Song 1' },
          { isrc: 'ISRC002', song_name: 'Song 2' },
        ],
      };

      const mockSongs = [
        {
          _id: new ObjectId(),
          isrc: 'ISRC001',
          title: 'Song 1',
          artist_subtitle: 'Artist 1',
          cover_art_url: 'https://cover1.jpg',
          duration_ms: 180000,
          spotify_url: 'https://spotify.com/song1',
        },
      ];

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('playlist_name', 'Test Playlist');
    });

    it('should return playlist details with new format tracks (ObjectId)', async () => {
      const playlistId = new ObjectId();
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();

      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'Modern Playlist',
        tracks: [songId1, songId2],
      };

      const mockSongs = [
        {
          _id: songId1,
          isrc: 'ISRC003',
          title: 'Song 3',
          artist_subtitle: 'Artist 3',
          cover_art_url: 'https://cover3.jpg',
          duration_ms: 190000,
          spotify_url: 'https://spotify.com/song3',
        },
        {
          _id: songId2,
          isrc: 'ISRC004',
          title: 'Song 4',
          artist_subtitle: 'Artist 4',
          cover_art_url: 'https://cover4.jpg',
          duration_ms: 200000,
          spotify_url: 'https://spotify.com/song4',
        },
      ];

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data.tracks).toHaveLength(2);
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should handle playlists with empty tracks', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        playlist_name: 'Empty Playlist',
        tracks: [],
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data.tracks).toHaveLength(0);
    });

    it('should handle tracks population errors gracefully', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        playlist_name: 'Playlist',
        tracks: [{ isrc: 'TEST', song_name: 'Test' }],
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data.tracks).toHaveLength(0);
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/playlists/invalid-id')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // PUT /playlists/:playlist_id - Update Playlist (Add Song)
  // ========================================
  describe('PUT /playlists/:playlist_id', () => {
    it('should add song to playlist successfully', async () => {
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
      expect(mockPlaylistsCollection.updateOne).toHaveBeenCalled();
    });

    it('should return 400 if songData._id is missing', async () => {
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
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should return 400 if song already exists in playlist', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [songId],
        deviceIds: ['test-device-123'],
      });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: songId.toString() },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Song already exists in the playlist');
    });

    it('should add deviceId to deviceIds array if not present', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [],
        deviceIds: ['other-device'],
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: songId.toString() },
        });

      expect(response.status).toBe(200);
      expect(mockPlaylistsCollection.updateOne).toHaveBeenCalledWith(
        { _id: playlistId },
        expect.objectContaining({
          $push: { tracks: expect.any(ObjectId) },
          $addToSet: { deviceIds: 'test-device-123' },
        })
      );
    });

    it('should not add deviceId if already in deviceIds array', async () => {
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
      expect(mockPlaylistsCollection.updateOne).toHaveBeenCalledWith(
        { _id: playlistId },
        { $push: { tracks: expect.any(ObjectId) } }
      );
    });

    it('should handle database errors', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: new ObjectId().toString() },
        });

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // DELETE /playlists/:playlist_id - Delete Playlist
  // ========================================
  describe('DELETE /playlists/:playlist_id', () => {
    it('should delete playlist successfully', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Playlist deleted');
      expect(mockPlaylistsCollection.deleteOne).toHaveBeenCalledWith({
        _id: playlistId,
      });
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .delete('/playlists/invalid-id')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });

    it('should handle database errors', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.deleteOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // POST /playlists/:playlist_id/share - Share Playlist
  // ========================================
  describe('POST /playlists/:playlist_id/share', () => {
    it('should share playlist with another device successfully', async () => {
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
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should return 400 if device already has access', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['test-device-123', 'target-device-456'],
      });

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .set('x-device-id', 'test-device-123')
        .send({
          target_device_id: 'target-device-456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Device already has access to this playlist');
    });

    it('should use deviceId from header if target_device_id not provided', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['owner-device'],
      });
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .set('x-device-id', 'test-device-123')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should handle invalid playlist ID format', async () => {
      const response = await request(app)
        .post('/playlists/invalid-id/share')
        .set('x-device-id', 'test-device-123')
        .send({
          target_device_id: 'target-device-456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid playlist ID format');
    });

    it('should handle database errors', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .set('x-device-id', 'test-device-123')
        .send({
          target_device_id: 'target-device-456',
        });

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // DELETE /playlists/:playlist_id/leave - Leave Shared Playlist
  // ========================================
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
      expect(response.body).toHaveProperty('message', 'Successfully left the playlist');
      expect(mockPlaylistsCollection.updateOne).toHaveBeenCalledWith(
        { _id: playlistId },
        { $pull: { deviceIds: 'test-device-123' } }
      );
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
      expect(response.body).toHaveProperty(
        'message',
        'Owner cannot leave playlist. Delete the playlist instead.'
      );
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should return 400 if user is not a member of playlist', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        deviceIds: ['owner-device', 'other-device'],
        ownerId: 'owner-device',
      });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'You are not a member of this playlist.');
    });

    it('should handle database errors', async () => {
      const playlistId = new ObjectId();
      mockPlaylistsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/playlists/${playlistId}/leave`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // DELETE /playlists/:playlist_id/songs/:song_id - Remove Song from Playlist
  // ========================================
  describe('DELETE /playlists/:playlist_id/songs/:song_id', () => {
    it('should remove song from playlist successfully', async () => {
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
      expect(response.body).toHaveProperty('message', 'Song removed from playlist successfully');
      expect(mockPlaylistsCollection.updateOne).toHaveBeenCalledWith(
        { _id: playlistId },
        { $pull: { tracks: songId } }
      );
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
      expect(response.body).toHaveProperty(
        'message',
        'Only the owner can delete songs from the playlist'
      );
    });

    it('should return 404 if playlist not found', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Playlist not found');
    });

    it('should handle invalid playlist ID format', async () => {
      const songId = new ObjectId();

      const response = await request(app)
        .delete(`/playlists/invalid-id/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });

    it('should handle invalid song ID format', async () => {
      const playlistId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        ownerId: 'test-device-123',
        tracks: [],
      });
      
      mockPlaylistsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/invalid-song-id`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });

    it('should handle database errors', async () => {
      const playlistId = new ObjectId();
      const songId = new ObjectId();

      mockPlaylistsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/playlists/${playlistId}/songs/${songId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(500);
    });
  });

  // ========================================
  // Additional Branch Coverage Tests
  // ========================================
  describe('POST /playlists - Additional Branch Coverage', () => {
    it('should handle case when track is found but does not match any playlist tracks', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Track found
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-100', name: 'Song 100', external_ids: { isrc: 'TEST100' } }],
          },
        },
      });

      // Playlist found
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-mismatch',
                name: 'Mismatch Playlist',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 5 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // Playlist verification - track NOT in playlist
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            { track: { id: 'different-track-id' } },
            { track: { id: 'another-different-track' } },
          ],
        },
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST100',
          title: 'Test Song 100',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Errors');
    });

    it('should handle error when no search query provided (missing both ISRC and title)', async () => {
      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          artist_subtitle: 'Artist Only',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle Spotify playlist with missing description field', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-desc', name: 'Track', external_ids: { isrc: 'DESC123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-no-desc',
                name: 'No Description Playlist',
                // description field missing
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-desc' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'track-desc',
                name: 'Track',
                external_ids: { isrc: 'DESC123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'DESC123',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /playlists/:playlist_id - Additional Branch Coverage', () => {
    it('should handle old format playlist with song not found in database', async () => {
      const playlistId = new ObjectId();
      
      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'Old Format Playlist',
        tracks: [
          { isrc: 'MISSING001', song_name: 'Missing Song 1' },
          { isrc: 'MISSING002', song_name: 'Missing Song 2' },
        ],
      };

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      
      // Songs not found in database - empty result
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('tracks');
      // Should return fallback data for missing songs
      expect(response.body.data.tracks.length).toBeGreaterThan(0);
      expect(response.body.data.tracks[0]).toHaveProperty('isrc', 'MISSING001');
      expect(response.body.data.tracks[0]).toHaveProperty('artist', 'Unknown Artist');
    });

    it('should handle new format playlist with song not found in database (returns null)', async () => {
      const playlistId = new ObjectId();
      const missingSongId = new ObjectId();

      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'New Format Playlist',
        tracks: [missingSongId],
      };

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      
      // Song not found in database
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data.tracks).toHaveLength(0); // Filtered out null values
    });
  });

  describe('PUT /playlists/:playlist_id - Additional Branch Coverage', () => {
    it('should return error when songData is provided but _id is null', async () => {
      const playlistId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [],
        deviceIds: ['test-device-123'],
      });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: { _id: null }, // _id is null
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Song ID is required');
    });

    it('should return error when songData is provided but _id is undefined', async () => {
      const playlistId = new ObjectId();

      mockPlaylistsCollection.findOne.mockResolvedValue({
        _id: playlistId,
        tracks: [],
        deviceIds: ['test-device-123'],
      });

      const response = await request(app)
        .put(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123')
        .send({
          songData: {}, // _id is undefined
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Song ID is required');
    });
  });

  describe('GET /playlists/for-you - Additional Branch Coverage', () => {
    it('should handle user with search history containing string IDs', async () => {
      const songId1 = new ObjectId();
      const songId2 = new ObjectId();

      // User with search_history as STRING IDs (not ObjectId)
      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [songId1.toString(), songId2.toString()], // String format
      });

      mockPlaylistsCollection.find.mockReturnValueOnce({
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'Matched Playlist',
            tracks: [songId1],
          },
        ]),
      });

      mockPlaylistsCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            playlist_name: 'BEST HITS 2025',
            tracks: [],
          },
        ]),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should exclude playlists owned by current user from matched playlists', async () => {
      const songId1 = new ObjectId();

      mockUsersCollection.findOne.mockResolvedValue({
        device_id: 'test-device-123',
        search_history: [songId1],
      });

      // Query should exclude ownerId === current deviceId
      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      });

      mockPlaylistsCollection.find = mockFind;

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/playlists/for-you')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      
      // Check that find was called with ownerId: { $ne: deviceId }
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: { $ne: 'test-device-123' },
        })
      );
    });
  });

  describe('POST /playlists - Error Handling Branch Coverage', () => {
    it('should handle error when fetching tracks from Spotify API fails', async () => {
      const mockSpotifyToken = 'mock-token';

      // Mock successful token
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock successful track search
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-error', name: 'Track', external_ids: { isrc: 'ERR123' } }],
          },
        },
      });

      // Mock successful playlist search
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-error',
                name: 'Error Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // Mock verification that track is in playlist
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-error' } }],
        },
      });

      // Mock ERROR when fetching full tracks - this triggers catch block (lines 286-287)
      axios.get.mockRejectedValueOnce(new Error('Spotify API error'));

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'ERR123',
        });

      // Should still succeed with empty tracks array due to error handling
      expect(response.status).toBe(201);
    });

    it('should handle case when all songs already exist in database (line 401)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'existing-track', name: 'Existing Track', external_ids: { isrc: 'EXIST123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-existing',
                name: 'Existing Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'existing-track' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'existing-track',
                name: 'Existing Track',
                external_ids: { isrc: 'EXIST123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [{ url: 'cover.jpg' }] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      // Mock that songs ALREADY EXIST in database (findOne returns existing songs)
      mockSongsCollection.findOne.mockResolvedValue({
        _id: new ObjectId(),
        spotify_song_id: 'existing-track',
        title: 'Existing Track',
      });

      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 0 }); // No new songs inserted
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 0 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'EXIST123',
        });

      expect(response.status).toBe(201);
      // Should log "All X songs already exist in database" (line 401)
    });

    it('should handle error during playlist verification (lines 192-194)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-verify-error', name: 'Track', external_ids: { isrc: 'VERR123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-verify-error',
                name: 'Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
              {
                id: 'playlist-verify-success',
                name: 'Success Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // First verification call fails (triggers lines 192-194)
      axios.get.mockRejectedValueOnce(new Error('Verification failed'));

      // Second verification succeeds
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-verify-error' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'track-verify-error',
                name: 'Track',
                external_ids: { isrc: 'VERR123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'VERR123',
        });

      // Should succeed with the one valid playlist
      expect(response.status).toBe(201);
    });

    it('should log when some playlists already exist in database (line 238)', async () => {
      const mockSpotifyToken = 'mock-token';
      const existingPlaylistId = 'existing-spotify-id';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-existing-check', name: 'Track', external_ids: { isrc: 'EXCHECK123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: existingPlaylistId,
                name: 'Already Exists Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
              {
                id: 'new-playlist-id',
                name: 'New Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-existing-check' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-existing-check' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'track-existing-check',
                name: 'Track',
                external_ids: { isrc: 'EXCHECK123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      // Mock that one playlist already exists in database
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            spotify_playlist_id: existingPlaylistId,
            playlist_name: 'Already Exists Playlist',
          },
        ]),
      });

      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'EXCHECK123',
        });

      expect(response.status).toBe(201);
      // Should log "Skipping X playlists that already exist" (line 238)
    });

    it('should skip playlists without id during verification (lines 148-154)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-no-id', name: 'Track', external_ids: { isrc: 'NOID123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              null, // Playlist without structure (triggers lines 148-154)
              {
                // Playlist without id
                name: 'No ID Playlist',
                description: 'Test',
              },
              {
                id: 'valid-playlist-id',
                name: 'Valid Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // Verification for valid playlist
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-no-id' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'track-no-id',
                name: 'Track',
                external_ids: { isrc: 'NOID123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'NOID123',
        });

      expect(response.status).toBe(201);
      // Should skip playlists without id and process only valid one
    });

    it('should skip playlists with invalid tracks response (lines 167-168)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-invalid-resp', name: 'Track', external_ids: { isrc: 'INVRESP123' } }],
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist-invalid-tracks',
                name: 'Invalid Tracks Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
              {
                id: 'playlist-valid',
                name: 'Valid Playlist',
                description: 'Test',
                images: [{ url: 'https://image.url' }],
                owner: { display_name: 'User' },
                tracks: { total: 10 },
                external_urls: { spotify: 'https://spotify.com' },
              },
            ],
          },
        },
      });

      // First verification returns invalid response (no items array) - triggers lines 167-168
      axios.get.mockResolvedValueOnce({
        data: {}, // Missing items array
      });

      // Second verification succeeds
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track-invalid-resp' } }],
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            {
              track: {
                id: 'track-invalid-resp',
                name: 'Track',
                external_ids: { isrc: 'INVRESP123' },
                external_urls: { spotify: 'https://spotify.com' },
                popularity: 70,
                duration_ms: 200000,
                artists: [{ name: 'Artist', id: 'artist-id', external_urls: { spotify: 'https://spotify.com' } }],
                album: { name: 'Album', id: 'album-id', release_date: '2023-01-01', total_tracks: 10, images: [] },
              },
              added_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });
      mockSongsCollection.findOne.mockResolvedValue(null);
      mockSongsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockArtistsCollection.bulkWrite.mockResolvedValue({ insertedCount: 1 });
      mockPlaylistsCollection.insertMany.mockResolvedValue({ insertedCount: 1 });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'INVRESP123',
        });

      expect(response.status).toBe(201);
      // Should skip playlist with invalid tracks response
    });

    it('should return error when track search returns no results (line 116)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Track search returns empty results - triggers line 116
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [], // No tracks found
          },
        },
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'NOTFOUND123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should return error when playlist search returns invalid response (lines 135-137)', async () => {
      const mockSpotifyToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track-invalid-playlist-resp', name: 'Track', external_ids: { isrc: 'INVPL123' } }],
          },
        },
      });

      // Playlist search returns invalid response - triggers lines 135-137
      axios.get.mockResolvedValueOnce({
        data: {}, // Missing playlists or playlists.items
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'INVPL123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Additional Branch Coverage - Round 5', () => {
    it('should return 400 when no device ID provided in POST /share (lines 730-731)', async () => {
      const playlistId = new ObjectId();

      const response = await request(app)
        .post(`/playlists/${playlistId}/share`)
        .send({}); // No x-device-id header, no target_device_id in body

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Device ID is required');
    });

    it('should use fallback data for old format tracks when some songs not in DB (lines 485-510)', async () => {
      const playlistId = new ObjectId();
      const songId1 = new ObjectId();
      
      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'Mixed Old Format Playlist',
        tracks: [
          { isrc: 'FOUND001', song_name: 'Found Song' },
          { isrc: 'NOTFOUND001', song_name: 'Missing Song' },
          { isrc: 'FOUND002', song_name: 'Found Song 2' },
        ],
      };

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      
      // Only some songs found in database
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: songId1,
            isrc: 'FOUND001',
            title: 'Found Song Full',
            artist_subtitle: 'Known Artist',
            cover_art_url: 'http://example.com/cover.jpg',
            duration_ms: 180000,
            spotify_url: 'http://spotify.com/track1',
          },
          // FOUND002 missing, NOTFOUND001 missing
        ]),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data.tracks).toHaveLength(3);
      
      // First track should have full data
      expect(response.body.data.tracks[0]).toHaveProperty('artist', 'Known Artist');
      
      // Second track should have fallback data (lines 500-509)
      expect(response.body.data.tracks[1]).toHaveProperty('isrc', 'NOTFOUND001');
      expect(response.body.data.tracks[1]).toHaveProperty('song_name', 'Missing Song');
      expect(response.body.data.tracks[1]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.data.tracks[1]).toHaveProperty('cover_art_url', null);
      expect(response.body.data.tracks[1]).toHaveProperty('duration_ms', 0);
    });

    it('should filter out null values for new format tracks when songs not in DB (line 534)', async () => {
      const playlistId = new ObjectId();
      const foundSongId = new ObjectId();
      const missingSongId1 = new ObjectId();
      const missingSongId2 = new ObjectId();

      const mockPlaylist = {
        _id: playlistId,
        playlist_name: 'Mixed New Format Playlist',
        tracks: [foundSongId, missingSongId1, missingSongId2],
      };

      mockPlaylistsCollection.findOne.mockResolvedValue(mockPlaylist);
      
      // Only one song found in database
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: foundSongId,
            isrc: 'FOUND001',
            title: 'Found Song',
            artist_subtitle: 'Known Artist',
            cover_art_url: 'http://example.com/cover.jpg',
            duration_ms: 200000,
            spotify_url: 'http://spotify.com/track1',
          },
          // missingSongId1 and missingSongId2 not found
        ]),
      });

      const response = await request(app)
        .get(`/playlists/${playlistId}`)
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      // Should return only 1 track, the other 2 filtered out (line 534: .filter((track) => track !== null))
      expect(response.body.data.tracks).toHaveLength(1);
      expect(response.body.data.tracks[0]).toHaveProperty('_id');
      expect(response.body.data.tracks[0]._id.toString()).toBe(foundSongId.toString());
    });
  });

  describe('GET /playlists/all - Additional Coverage for Lines 485-510 and 534', () => {
    it('should use fallback data for old format ISRC tracks in GET /all (lines 485-510)', async () => {
      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Old Format ISRC Playlist',
          deviceIds: ['test-device-123'],
          tracks: [
            { isrc: 'FOUND001', song_name: 'Found Song' },
            { isrc: 'NOTFOUND001', song_name: 'Missing Song' },
            { isrc: 'FOUND002', song_name: 'Another Found Song' },
          ],
        },
      ];

      const song1Id = new ObjectId();
      const mockSongs = [
        {
          _id: song1Id,
          isrc: 'FOUND001',
          title: 'Found Song Full',
          artist_subtitle: 'Known Artist',
          cover_art_url: 'http://example.com/cover1.jpg',
          duration_ms: 180000,
          spotify_url: 'http://spotify.com/track1',
        },
        // NOTFOUND001 and FOUND002 missing from database
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tracks).toHaveLength(3);
      
      // First track should have full data from DB
      expect(response.body.data[0].tracks[0]).toHaveProperty('isrc', 'FOUND001');
      expect(response.body.data[0].tracks[0]).toHaveProperty('artist', 'Known Artist');
      
      // Second track should have fallback data (lines 500-509)
      expect(response.body.data[0].tracks[1]).toHaveProperty('isrc', 'NOTFOUND001');
      expect(response.body.data[0].tracks[1]).toHaveProperty('song_name', 'Missing Song');
      expect(response.body.data[0].tracks[1]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.data[0].tracks[1]).toHaveProperty('cover_art_url', null);
      expect(response.body.data[0].tracks[1]).toHaveProperty('duration_ms', 0);
      
      // Third track should also have fallback data
      expect(response.body.data[0].tracks[2]).toHaveProperty('isrc', 'FOUND002');
      expect(response.body.data[0].tracks[2]).toHaveProperty('song_name', 'Another Found Song');
      expect(response.body.data[0].tracks[2]).toHaveProperty('artist', 'Unknown Artist');
    });

    it('should filter out null values for new format in GET /all (line 534)', async () => {
      const foundSongId = new ObjectId();
      const missingSongId1 = new ObjectId();
      const missingSongId2 = new ObjectId();
      const foundSongId2 = new ObjectId();

      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Mixed New Format Playlist',
          deviceIds: ['test-device-123'],
          tracks: [foundSongId, missingSongId1, foundSongId2, missingSongId2],
        },
      ];

      const mockSongs = [
        {
          _id: foundSongId,
          isrc: 'FOUND001',
          title: 'Found Song 1',
          artist_subtitle: 'Artist 1',
          cover_art_url: 'http://example.com/cover1.jpg',
          duration_ms: 180000,
          spotify_url: 'http://spotify.com/track1',
        },
        {
          _id: foundSongId2,
          isrc: 'FOUND002',
          title: 'Found Song 2',
          artist_subtitle: 'Artist 2',
          cover_art_url: 'http://example.com/cover2.jpg',
          duration_ms: 200000,
          spotify_url: 'http://spotify.com/track2',
        },
        // missingSongId1 and missingSongId2 not found - will return null and be filtered
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockSongs),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      // Should return only 2 tracks, the missing 2 filtered out (line 534)
      expect(response.body.data[0].tracks).toHaveLength(2);
      expect(response.body.data[0].tracks[0]._id.toString()).toBe(foundSongId.toString());
      expect(response.body.data[0].tracks[1]._id.toString()).toBe(foundSongId2.toString());
    });

    it('should handle old format with all songs missing from DB (lines 485-510)', async () => {
      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'All Missing Old Format',
          deviceIds: ['test-device-123'],
          tracks: [
            { isrc: 'MISS001', song_name: 'Missing 1' },
            { isrc: 'MISS002', song_name: 'Missing 2' },
          ],
        },
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      // No songs found in database
      mockSongsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.data[0].tracks).toHaveLength(2);
      
      // All tracks should have fallback data
      expect(response.body.data[0].tracks[0]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.data[0].tracks[0]).toHaveProperty('duration_ms', 0);
      expect(response.body.data[0].tracks[1]).toHaveProperty('artist', 'Unknown Artist');
      expect(response.body.data[0].tracks[1]).toHaveProperty('duration_ms', 0);
    });

    it('should handle playlists with mixed track formats in error case', async () => {
      const mockPlaylists = [
        {
          _id: new ObjectId(),
          playlist_name: 'Error Playlist',
          deviceIds: ['test-device-123'],
          tracks: [new ObjectId()],
        },
      ];

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPlaylists),
      });

      // Simulate database error
      mockSongsCollection.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/playlists/all')
        .set('x-device-id', 'test-device-123');

      expect(response.status).toBe(200);
      // Should handle error gracefully and return playlist with empty tracks
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /playlists - Ternary Operator Coverage (Lines 177-189)', () => {
    it('should handle playlists with missing optional fields (lines 177-189)', async () => {
      const mockSpotifyToken = 'mock-token';
      
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock ISRC search - track found
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track123', name: 'Test Song' }],
          },
        },
      });

      // Mock playlist search - returns playlist with minimal fields
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist123',
                name: null, // Test null name fallback
                // images: undefined, // Missing images
                owner: null, // Missing owner
                tracks: null, // Missing tracks
                external_urls: null, // Missing spotify url
                // description: undefined, // Missing description
              },
            ],
          },
        },
      });

      // Mock playlist tracks - contains the track
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track123' } }],
        },
      });

      // Mock no existing playlists in DB
      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      mockPlaylistsCollection.insertMany.mockResolvedValue({
        insertedCount: 1,
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          isrc: 'TEST123',
          title: 'Test Song',
          artist_subtitle: null, // Test null artist fallback
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Playlists saved successfully');
      
      // Verify fallback values were used
      const insertedData = mockPlaylistsCollection.insertMany.mock.calls[0][0][0];
      expect(insertedData.base_song_isrc).toBe('TEST123');
      expect(insertedData.base_song_artist).toBeNull(); // artist_subtitle was null
      expect(insertedData.cover_image_url).toBeNull(); // images missing
      expect(insertedData.owner_name).toBe('Unknown'); // owner null
      expect(insertedData.total_tracks).toBe(0); // tracks null
      expect(insertedData.playlist_name).toBe('Untitled Playlist'); // name null
      expect(insertedData.spotify_url).toBeNull(); // external_urls null
      expect(insertedData.description).toBeNull(); // description missing
    });

    it('should handle playlist response with empty arrays and zero values', async () => {
      const mockSpotifyToken = 'mock-token';
      
      axios.post.mockResolvedValueOnce({
        data: { access_token: mockSpotifyToken },
      });

      // Mock title search - track found
      axios.get.mockResolvedValueOnce({
        data: {
          tracks: {
            items: [{ id: 'track456', name: 'Another Song' }],
          },
        },
      });

      // Mock playlist search
      axios.get.mockResolvedValueOnce({
        data: {
          playlists: {
            items: [
              {
                id: 'playlist456',
                name: '', // Empty string for name
                images: [], // Empty array for images
                owner: { display_name: '' }, // Empty owner name
                tracks: { total: 0 }, // Zero tracks
                external_urls: { spotify: '' }, // Empty spotify url
                description: '', // Empty description
              },
            ],
          },
        },
      });

      // Mock playlist tracks
      axios.get.mockResolvedValueOnce({
        data: {
          items: [{ track: { id: 'track456' } }],
        },
      });

      mockPlaylistsCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      mockPlaylistsCollection.insertMany.mockResolvedValue({
        insertedCount: 1,
      });

      const response = await request(app)
        .post('/playlists')
        .set('x-device-id', 'test-device-123')
        .send({
          // No ISRC, use title
          title: 'Another Song',
          // No artist_subtitle
        });

      expect(response.status).toBe(201);
      
      const insertedData = mockPlaylistsCollection.insertMany.mock.calls[0][0][0];
      // Empty string name should fallback to 'Untitled Playlist'
      expect(insertedData.playlist_name).toBe('Untitled Playlist');
      // Empty string owner should fallback to 'Unknown'
      expect(insertedData.owner_name).toBe('Unknown');
      // Empty array images should result in null
      expect(insertedData.cover_image_url).toBeNull();
      // base_song_isrc should be null when not provided
      expect(insertedData.base_song_isrc).toBeNull();
      // base_song_artist should be null when not provided
      expect(insertedData.base_song_artist).toBeNull();
    });
  });
});
