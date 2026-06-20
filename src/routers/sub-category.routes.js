const express = require('express')
const router = express.Router()
const subCategoryController = require('../controllers/sub-category.controller')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', subCategoryController.getAll)
router.get('/private/:id', authenticate, subCategoryController.getByIdPrivate)
router.get('/:id', subCategoryController.getById)
router.post('/', authenticate, subCategoryController.create)
router.put('/:id', authenticate, subCategoryController.update)
router.delete('/:id', authenticate, subCategoryController.remove)

module.exports = router
