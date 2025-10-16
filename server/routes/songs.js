const Controller = require('../controllers/Controller')
const router = require('express').Router()

router.get('/', Controller.findAll)

module.exports = router