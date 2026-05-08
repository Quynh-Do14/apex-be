const express = require('express')
const router = express.Router()
const agencyController = require('../controllers/agency.controller')
const upload = require('../middlewares/upload.middleware')
const { authenticate } = require('../middlewares/auth.middleware')

// CRUD operations
router.get('/', agencyController.getAll)
router.get('/private', authenticate, agencyController.getAllPrivate)
router.get('/private/:id', authenticate, agencyController.getByIdPrivate)
router.get('/:id', agencyController.getById)
router.post('/', authenticate, upload.single('image'), agencyController.create)
router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  agencyController.update
)
router.delete('/:id', authenticate, agencyController.remove)

module.exports = router
