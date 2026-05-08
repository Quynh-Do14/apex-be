const express = require('express')
const router = express.Router()
const bannerController = require('../controllers/banner.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', bannerController.getAll)
router.get('/private', authenticate, bannerController.getAllPrivate)
router.get('/private/:id', authenticate, bannerController.getByIdPrivate)
router.get('/:id', bannerController.getById)
router.post('/', upload.single('image'), authenticate, bannerController.create)
router.put(
  '/:id',
  upload.single('image'),
  authenticate,
  bannerController.update
)
router.delete('/:id', authenticate, bannerController.remove)

module.exports = router
