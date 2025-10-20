// ========================================
// ARTISTS API TESTS
// ========================================
// Tests for artists endpoints

const request = require('supertest');
const { ObjectId } = require('mongodb');
const app = require('../app');
const axios = require('axios');

// Mock axios untuk external API calls (Ticketmaster)
jest.mock('axios');

// Mock MongoDB connection
jest.mock('../config/mongodb', () => ({
  getDB: jest.fn(),
}));

const { getDB } = require('../config/mongodb');

describe('Artists API Endpoints', () => {
  let mockDb;
  let mockArtistsCollection;

  beforeAll(() => {
    // Setup mock collections
    mockArtistsCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    // Mock database
    mockDb = {
      collection: jest.fn((collectionName) => {
        if (collectionName === 'artists') return mockArtistsCollection;
        return mockArtistsCollection; // Default to artists collection
      }),
    };

    getDB.mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // GET /artists/:id/concerts
  // ========================================
  describe('GET /artists/:id/concerts - Get Artist Concerts (Ticketmaster)', () => {
    const validArtistId = new ObjectId().toString();

    it('should return upcoming concerts for an artist', async () => {
      // Mock artist data
      const mockArtist = {
        _id: new ObjectId(validArtistId),
        name: 'Taylor Swift',
        slug: 'taylor-swift',
        spotify_id: 'spotify123',
      };

      // Mock Ticketmaster API response - full structure
      const mockTicketmasterResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event1',
                name: 'Taylor Swift - The Eras Tour',
                dates: {
                  start: {
                    localDate: '2025-05-15',
                    localTime: '19:00:00',
                    dateTime: '2025-05-15T19:00:00Z',
                  },
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Madison Square Garden',
                      city: {
                        name: 'New York',
                      },
                      state: {
                        stateCode: 'NY',
                      },
                      country: {
                        name: 'United States',
                        countryCode: 'US',
                      },
                      location: {
                        latitude: '40.750556',
                        longitude: '-73.993611',
                      },
                    },
                  ],
                  attractions: [
                    {
                      name: 'Taylor Swift',
                    },
                  ],
                },
                url: 'https://ticketmaster.com/taylor-swift',
                info: 'Amazing concert event',
              },
              {
                id: 'event2',
                name: 'Taylor Swift Live in Concert',
                dates: {
                  start: {
                    localDate: '2025-06-20',
                    dateTime: '2025-06-20T20:00:00Z',
                  },
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Staples Center',
                      city: {
                        name: 'Los Angeles',
                      },
                      state: {
                        stateCode: 'CA',
                      },
                      country: {
                        name: 'United States',
                        countryCode: 'US',
                      },
                      location: {
                        latitude: '34.043018',
                        longitude: '-118.267254',
                      },
                    },
                  ],
                  attractions: [
                    {
                      name: 'Taylor Swift',
                    },
                  ],
                },
                url: 'https://ticketmaster.com/taylor-swift-la',
              },
            ],
          },
        },
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValue(mockTicketmasterResponse);

      const response = await request(app).get(`/artists/${validArtistId}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('concerts');
      expect(response.body).toHaveProperty('artist');
      expect(response.body.concerts).toBeInstanceOf(Array);
      expect(response.body.concerts.length).toBe(2);
      expect(response.body.total).toBe(2);

      // Check artist info
      expect(response.body.artist).toMatchObject({
        name: 'Taylor Swift',
      });

      // Check first concert structure
      expect(response.body.concerts[0]).toMatchObject({
        id: 'event1',
        title: 'Taylor Swift - The Eras Tour',
        datetime: '2025-05-15T19:00:00Z',
        venue: {
          name: 'Madison Square Garden',
          city: 'New York',
          country: 'United States',
        },
        url: 'https://ticketmaster.com/taylor-swift',
      });

      // Verify axios was called with correct parameters
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://app.ticketmaster.com/discovery/v2/events.json'),
        expect.objectContaining({
          params: expect.objectContaining({
            keyword: 'Taylor Swift',
          }),
        })
      );
    });

    it('should return 400 for invalid artist ID format', async () => {
      const invalidArtistId = 'invalid-id';

      const response = await request(app).get(`/artists/${invalidArtistId}/concerts`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid artist ID');
    });

    it('should return 404 if artist not found', async () => {
      mockArtistsCollection.findOne.mockResolvedValue(null);

      const response = await request(app).get(`/artists/${validArtistId}/concerts`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Artist not found');
    });

    it('should return empty array if no concerts found', async () => {
      const mockArtist = {
        _id: new ObjectId(validArtistId),
        name: 'Unknown Artist',
        slug: 'unknown-artist',
      };

      // Mock empty response from Ticketmaster (no _embedded field)
      const mockTicketmasterResponse = {
        data: {},
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      axios.get.mockResolvedValue(mockTicketmasterResponse);

      const response = await request(app).get(`/artists/${validArtistId}/concerts`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('concerts');
      expect(response.body).toHaveProperty('artist');
      expect(response.body.concerts).toBeInstanceOf(Array);
      expect(response.body.concerts.length).toBe(0);
      expect(response.body.total).toBe(0);
    });

    it('should handle Ticketmaster API errors gracefully', async () => {
      const mockArtist = {
        _id: new ObjectId(validArtistId),
        name: 'Taylor Swift',
        slug: 'taylor-swift',
      };

      mockArtistsCollection.findOne.mockResolvedValue(mockArtist);
      
      // Mock Ticketmaster API error
      axios.get.mockRejectedValue(new Error('Ticketmaster API error'));

      const response = await request(app).get(`/artists/${validArtistId}/concerts`);

      expect(response.status).toBe(200); // Server returns 200 with empty concerts on API error
      expect(response.body).toHaveProperty('concerts');
      expect(response.body.concerts).toBeInstanceOf(Array);
      expect(response.body.concerts.length).toBe(0);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unable to fetch concerts');
    });

    it('should handle database errors gracefully', async () => {
      mockArtistsCollection.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(`/artists/${validArtistId}/concerts`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });
});
