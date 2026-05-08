const express = require('express')
const router = express.Router()
const productSeriesController = require('../controllers/product-series.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', productSeriesController.getAll)
router.get('/:id', productSeriesController.getById)

router.post(
  '/',
  upload.single('image'),
  authenticate,
  productSeriesController.create
)
router.put(
  '/:id',
  upload.single('image'),
  authenticate,
  productSeriesController.update
)
router.delete('/:id', authenticate, productSeriesController.remove)

module.exports = router
