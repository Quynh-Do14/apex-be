const AppError = require('../utils/AppError')

const errorHandler = (err, req, res, next) => {
  // Log lỗi ra console để debug
  console.error('🚨 ERROR:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode
  })

  // Lỗi từ PostgreSQL
  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Không thể xóa vì có dữ liệu liên quan đang sử dụng',
      error: err.message
    })
  }

  if (err.code === '23505') {
    // Unique violation
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đã tồn tại',
      error: err.message
    })
  }

  // Lỗi từ AppError (custom error)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
  }

  // Lỗi từ JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    })
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors
    })
  }

  // Lỗi mặc định
  const statusCode = err.statusCode || 500
  const message = err.message || 'Something went wrong!'

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  })
}

module.exports = errorHandler
