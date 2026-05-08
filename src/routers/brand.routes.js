const express = require('express')
const router = express.Router()
const brandController = require('../controllers/brand.controller')
const upload = require('../middlewares/upload.middleware')

// CRUD danh mục sản phẩm
router.get('/', brandController.getAll)
router.get('/:id', brandController.getById)
router.post('/', upload.single('image'), brandController.create)
router.put('/:id', upload.single('image'), brandController.update)
router.delete('/:id', brandController.remove)

module.exports = router
