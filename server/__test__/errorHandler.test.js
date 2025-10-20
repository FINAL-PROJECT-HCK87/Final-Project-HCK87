const errorHandler = require('../errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('DocumentNotFoundError case', () => {
    it('should return 404 status with document not found message', () => {
      const error = {
        name: 'DocumentNotFoundError',
        message: 'Document does not exist',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Document not found',
        error: 'The requested document does not exist',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('No playlist found case', () => {
    it('should return 404 status with no playlist found message', () => {
      const error = {
        name: 'No playlist found',
        message: 'Playlist not found',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No playlist found',
        error: 'The requested document does not exist',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('MongoNetworkError case', () => {
    it('should return 503 status with database connection error message', () => {
      const error = {
        name: 'MongoNetworkError',
        message: 'Connection timeout',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database connection error',
        error: 'Unable to connect to MongoDB server',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Default case - Generic errors', () => {
    it('should return 500 status for unknown error types in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = {
        name: 'UnknownError',
        message: 'Something went wrong',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal Server Errors',
        error: undefined, // In production, error message is hidden
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 status with error message in development', () => {
      process.env.NODE_ENV = 'development';
      
      const error = {
        name: 'UnknownError',
        message: 'Something went wrong',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal Server Errors',
        error: 'Something went wrong', // In development, error message is shown
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors without name property', () => {
      const error = {
        message: 'Generic error without name',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle ValidationError (custom error)', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle NotFound error (custom error)', () => {
      const error = {
        name: 'NotFound',
        message: 'Resource not found',
      };

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error object variations', () => {
    it('should handle Error instance', () => {
      const error = new Error('Standard error');
      error.name = 'Error';

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle string error', () => {
      const error = 'String error message';

      errorHandler(error, req, res, next);

      expect(console.log).toHaveBeenCalledWith('Error:', error);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
