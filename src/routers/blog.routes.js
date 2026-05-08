const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blog.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', blogController.getAll)
router.get('/private', authenticate, blogController.getAllPrivate)
router.get('/private/:id', authenticate, blogController.getByIdPrivate)
router.get('/:id', blogController.getById)
router.post('/', upload.single('image'), authenticate, blogController.create)
router.put('/:id', upload.single('image'), authenticate, blogController.update)
router.delete('/:id', authenticate, blogController.remove)

module.exports = router
