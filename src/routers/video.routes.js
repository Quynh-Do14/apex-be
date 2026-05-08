const express = require('express')
const router = express.Router()
const videoController = require('../controllers/video.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', videoController.getAll)
router.get('/private', authenticate, videoController.getAllPrivate)
router.get('/private/:id', authenticate, videoController.getByIdPrivate)
router.get('/:id', videoController.getById)
router.post('/', authenticate, videoController.create)
router.put('/:id', authenticate, videoController.update)
router.delete('/:id', authenticate, videoController.remove)

module.exports = router
