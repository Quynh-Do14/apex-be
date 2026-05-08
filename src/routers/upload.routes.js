const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload.middleware')
const uploadController = require('../controllers/upload.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Route upload một ảnh
router.post(
  '/single',
  authenticate,
  upload.single('image'), // 'image' là tên field trong form-data
  uploadController.uploadSingle
)

module.exports = router
