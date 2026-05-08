const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

const uploadMultiple = upload.fields([
  { name: 'image', maxCount: 1 }, // ảnh chính
  { name: 'images', maxCount: 5 } // ảnh phụ (gallery)
])

router.get('/', productController.getAll)
router.get('/private', authenticate, productController.getAllPrivate)
router.get('/private/:id', authenticate, productController.getByIdPrivate)
router.get('/:id', productController.getById)
router.post('/', uploadMultiple, authenticate, productController.create)
router.put('/update-index', authenticate, productController.updateIndexes)
router.put('/:id', uploadMultiple, authenticate, productController.update)
router.delete('/:id', authenticate, productController.remove)

module.exports = router
