const { getDB } = require('../config/mongodb');

const authenticate = async (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(401).json({ message: 'Device ID required' });
  }
  const db = getDB();
  const collection = db.collection('users');
  const data = await collection.findOne({ device_id: deviceId });

  if (!data) {
    return res.status(404).json({ message: 'User not found' });
  }

  req.user = data;
  next();
};

module.exports = { authenticate };
