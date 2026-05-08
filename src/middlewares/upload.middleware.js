const multer = require('multer')
const path = require('path')

// Cấu hình nơi lưu file và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) // Lấy đuôi file (.jpg, .png, ...)
    const nameWithoutExt = path.basename(file.originalname, ext) // Lấy tên không có đuôi
    const sanitizedName = nameWithoutExt.replace(
      /[^a-zA-Z0-9_\u4e00-\u9fff\-\.]/g,
      '-'
    ) // Loại bỏ ký tự đặc biệt
    const uniqueName = `${sanitizedName}-${Date.now()}${ext}` // Thêm timestamp để tránh trùng
    cb(null, uniqueName)
  }
})

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg/png/webp)'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})

module.exports = upload
