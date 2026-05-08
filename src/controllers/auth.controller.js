const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { signToken } = require('../utils/jwt')
const userModel = require('../models/user.model')
const authModel = require('../models/auth.model') // Import auth model
const emailService = require('../middlewares/email.middleware')

// Lưu tạm thời reset tokens (chỉ dùng khi chưa có database)
const resetTokens = new Map()

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await userModel.findUserByEmail(email)
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword
    })

    // Không trả về password trong response
    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ user: userWithoutPassword })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' })
    }

    // Tìm user theo email
    const user = await userModel.findUserByEmail(email)

    // Kiểm tra tài khoản tồn tại
    if (!user) {
      return res.status(401).json({
        message: 'Tài khoản không tồn tại',
        errorCode: 'USER_NOT_FOUND'
      })
    }

    // Kiểm tra tài khoản bị khóa (disable)
    if (user.active === false || user.active === 1) {
      return res.status(403).json({
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên',
        errorCode: 'ACCOUNT_DISABLED'
      })
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        message: 'Mật khẩu không chính xác',
        errorCode: 'INVALID_PASSWORD'
      })
    }

    // Tạo token
    const accessToken = signToken({ id: user.id })

    res.json({
      accessToken: accessToken,
      refreshToken: ''
    })
  } catch (error) {
    console.error('Login error:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ',
        error: error.message
      })
    }

    if (error.name === 'DatabaseError') {
      return res.status(503).json({
        message: 'Lỗi kết nối cơ sở dữ liệu',
        errorCode: 'DATABASE_ERROR'
      })
    }

    res.status(500).json({
      message: 'Lỗi máy chủ nội bộ',
      errorCode: 'INTERNAL_SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Yêu cầu reset mật khẩu
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email là bắt buộc' })
    }

    // Tìm user theo email
    const user = await userModel.findUserByEmail(email)

    // Luôn trả về success ngay cả khi email không tồn tại (bảo mật)
    if (!user) {
      return res.status(200).json({
        message:
          'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu'
      })
    }

    // Tạo reset token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Hash token trước khi lưu
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Thời gian hết hạn: 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Lưu vào database
    await authModel.saveResetToken(user.id, hashedToken, expiresAt)

    // Tạo link reset password
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    // Gửi email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Vẫn return success để không lộ thông tin
    }

    res.status(200).json({
      message:
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      message: 'Lỗi máy chủ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Xác thực reset token
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        message: 'Token là bắt buộc',
        isValid: false
      })
    }

    // Hash token để kiểm tra
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Kiểm tra token trong database
    const user = await authModel.verifyResetToken(hashedToken)

    if (!user) {
      return res.status(400).json({
        message: 'Token không hợp lệ hoặc đã hết hạn',
        isValid: false
      })
    }

    res.status(200).json({
      message: 'Token hợp lệ',
      isValid: true,
      email: user.email
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    res.status(500).json({
      message: 'Lỗi máy chủ',
      isValid: false
    })
  }
}

/**
 * Đặt lại mật khẩu mới
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          'Vui lòng cung cấp đầy đủ: token, mật khẩu mới và xác nhận mật khẩu'
      })
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
      })
    }

    // Validate mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      })
    }

    // Hash token để kiểm tra
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Tìm user với token
    const user = await authModel.findUserByResetToken(hashedToken)

    if (!user) {
      return res.status(400).json({
        message: 'Token không hợp lệ hoặc đã hết hạn'
      })
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Cập nhật mật khẩu và xóa token
    const updatedUser = await authModel.resetPassword(user.id, hashedPassword)

    // Gửi email xác nhận
    try {
      await emailService.sendPasswordChangedEmail(
        updatedUser.email,
        updatedUser.name
      )
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError)
    }

    res.status(200).json({
      message: 'Đặt lại mật khẩu thành công'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      message: 'Lỗi máy chủ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await userModel.findUserById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { password, ...userWithoutPassword } = user
    res.json({
      user: userWithoutPassword
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, email } = req.body

    if (email) {
      const existingUser = await userModel.findUserByEmail(email)
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already exists' })
      }
    }

    const updatedUser = await userModel.updateUser(userId, { name, email })
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { password, ...userWithoutPassword } = updatedUser
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validation cơ bản
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          'Vui lòng cung cấp đầy đủ: mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu',
        errors: {
          currentPassword: !currentPassword
            ? 'Mật khẩu hiện tại là bắt buộc'
            : undefined,
          newPassword: !newPassword ? 'Mật khẩu mới là bắt buộc' : undefined,
          confirmPassword: !confirmPassword
            ? 'Xác nhận mật khẩu là bắt buộc'
            : undefined
        }
      })
    }

    // Kiểm tra mật khẩu mới và xác nhận
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
        errors: {
          confirmPassword: 'Mật khẩu xác nhận không khớp'
        }
      })
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        errors: {
          newPassword: 'Mật khẩu phải có ít nhất 6 ký tự'
        }
      })
    }

    // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
        errors: {
          newPassword: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
        }
      })
    }

    // Lấy thông tin user
    const user = await userModel.findUserById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' })
    }

    // Xác thực mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({
        message: 'Mật khẩu hiện tại không chính xác',
        errors: {
          currentPassword: 'Mật khẩu hiện tại không chính xác'
        }
      })
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Cập nhật mật khẩu
    const updatedUser = await authModel.changePasswordModel(userId, {
      password: hashedPassword
    })

    // Log thay đổi mật khẩu
    console.log(
      `User ${userId} changed password at ${new Date().toISOString()}`
    )

    // Gửi email thông báo (nếu có)
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.name)
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError)
    }

    res.json({
      message: 'Đổi mật khẩu thành công',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    })
  } catch (error) {
    console.error('Change password error:', error)

    if (error.message === 'Failed to update password') {
      return res.status(500).json({
        message: 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.'
      })
    }

    res.status(500).json({
      message: 'Lỗi máy chủ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword
}
