const express = require('express')
const router = express.Router()
const { authenticate } = require('../middlewares/auth.middleware')
const userController = require('../controllers/user.controller')

router.get('/', authenticate, userController.getAll)
router.get('/:id', authenticate, userController.getById)
router.post('/', authenticate, userController.create)
router.put('/:id', authenticate, userController.update)
router.delete('/:id', authenticate, userController.remove)
router.get('/me/profile', authenticate, userController.getProfile)

module.exports = router
