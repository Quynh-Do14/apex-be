const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contact.controller')
const { authenticate } = require('../middlewares/auth.middleware')

router.get('/', authenticate, contactController.getAll)
router.get('/:id', contactController.getById)
router.post('/', contactController.create)
router.put('/:id', authenticate, contactController.updateStatus)
router.delete('/:id', authenticate, contactController.remove)

module.exports = router
