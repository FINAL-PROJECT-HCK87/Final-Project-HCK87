const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  switch (err) {
    case 'DocumentNotFoundError':
      return res.status(404).json({ 
      message: 'Document not found',
      error: 'The requested document does not exist'
    });
    case 'MongoNetworkError':
      return res.status(503).json({ 
      message: 'Database connection error',
      error: 'Unable to connect to MongoDB server'
    });
    default:
      return res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }

}
module.exports = errorHandler;