const express = require('express')
const router = express.Router()
const contentPageController = require('../controllers/content-page.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD danh mục sản phẩm
router.get('/', contentPageController.getAll)
router.get('/:id', contentPageController.getById)
router.post('/', authenticate, contentPageController.create)
router.put('/:id', authenticate, contentPageController.update)
router.delete('/:id', authenticate, contentPageController.remove)

module.exports = router
