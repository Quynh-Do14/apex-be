const express = require('express')
const router = express.Router()
const agencyCategoryController = require('../controllers/agency-category.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', agencyCategoryController.getAll)
router.get('/:id', agencyCategoryController.getById)
router.post('/', authenticate, agencyCategoryController.create)
router.put('/:id', authenticate, agencyCategoryController.update)
router.delete('/:id', authenticate, agencyCategoryController.remove)

module.exports = router
