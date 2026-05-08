const express = require('express')
const router = express.Router()
const seriesController = require('../controllers/series.controller')

router.get('/', seriesController.getAll)
router.get('/:id', seriesController.getById)
router.post('/', seriesController.create)
router.put('/:id', seriesController.update)
router.delete('/:id', seriesController.remove)

module.exports = router
