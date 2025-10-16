const router = require('express').Router()
const song = require('./songs')


router.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Melodix API' })
})
router.use('/songs', song)


module.exports = router