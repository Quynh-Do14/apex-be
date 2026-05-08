const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/category.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', categoryController.getAll)
router.get('/private/:id', authenticate, categoryController.getByIdPrivate)
router.get('/:id', categoryController.getById)
router.post(
  '/',
  authenticate,
    upload.single('image'),
  categoryController.create
)
router.put(
  '/update-index',
  authenticate,
  //   upload.single('image'),
  categoryController.updateIndexes
)
router.put(
  '/:id',
  authenticate,
    upload.single('image'),
  categoryController.update
)
router.delete('/:id', authenticate, categoryController.remove)

module.exports = router
