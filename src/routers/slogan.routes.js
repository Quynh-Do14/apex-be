const express = require('express')
const router = express.Router()
const sloganController = require('../controllers/slogan.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', sloganController.getAll)
router.get('/private', authenticate, sloganController.getAllPrivate)
router.get('/private/:id', authenticate, sloganController.getByIdPrivate)
router.get('/:id', authenticate, sloganController.getById)
router.post('/', authenticate, upload.single('image'), sloganController.create)
router.put('/update-index', authenticate, sloganController.updateIndexes)
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  sloganController.update
)
router.delete('/:id', authenticate, sloganController.remove)

module.exports = router
