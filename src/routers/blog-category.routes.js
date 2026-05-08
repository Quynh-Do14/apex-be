const express = require('express')
const router = express.Router()
const blogCategoryController = require('../controllers/blog-category.controller')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', blogCategoryController.getAll)
router.get('/private/:id', authenticate, blogCategoryController.getByIdPrivate)
router.get('/:id', blogCategoryController.getById)
router.post('/', authenticate, blogCategoryController.create)
router.put('/:id', authenticate, blogCategoryController.update)
router.delete('/:id', authenticate, blogCategoryController.remove)

module.exports = router
