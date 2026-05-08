const express = require('express')
const router = express.Router()
const configPageController = require('../controllers/config-page.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', configPageController.getAll)
router.put('/update-index', authenticate, configPageController.updateIndexes)
router.get('/:id', authenticate, configPageController.getById)
router.post('/', authenticate, configPageController.create)
router.put('/:id', authenticate, configPageController.update)
router.delete('/:id', authenticate, configPageController.remove)

module.exports = router
