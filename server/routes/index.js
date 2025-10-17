const router = require('express').Router();
const song = require('./songs');
const user = require('./users');

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Melodix API' });
});
router.use('/songs', song);
router.use('/users', user);

module.exports = router;
