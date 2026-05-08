const userModel = require('../models/user.model')
const { ROLES } = require('../constants')

const uploadSingle = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      })
    }

    // Tạo URL cho ảnh đã upload
    const imageUrl = `/uploads/${req.file.filename}`

    res.status(200).json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `${process.env.BASE_API_URL}${imageUrl}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    })
  }
}

module.exports = {
  uploadSingle
}
