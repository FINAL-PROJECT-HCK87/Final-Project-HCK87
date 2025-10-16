const Controller = require('../controllers/Controller')
const router = require('express').Router()

router.get('/', Controller.findAll)
router.post('/', Controller.findAll) //simpan searched song ke db
// router.get('/', Controller.findAll) //search track dari spotify based on isrc dari data db
// router.get('/', Controller.findAll) //search playlist dari spotify

module.exports = router