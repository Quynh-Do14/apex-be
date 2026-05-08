const { ROLES, MESSAGES } = require('../constants')
const userModel = require('../models/user.model')
const bcrypt = require('bcrypt')

const getAll = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const search = req.query.search?.toString() || ''
    const active = req.query.active // Giữ nguyên, sẽ xử lý trong getAllUsers
    const role_id = req.query.role_id?.toString() || ''

    // Validate và parse số
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100) // Giới hạn max 100

    const users = await userModel.getAllUsers({
      search,
      active,
      role_id,
      limit,
      page
    })

    return res.status(200).json({
      success: true,
      ...users
    })
  } catch (error) {
    console.error('getAllUsers error:', error)
    return res.status(500).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}

const getById = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const user = await userModel.findUserById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const create = async (req, res) => {
  try {
    // Kiểm tra quyền
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.MANAGER] // Có thể mở rộng

    if (!profile || !allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
        errorCode: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const { name, email, password, role_id, phone_number } = req.body

    // Validation chi tiết
    const errors = []

    if (!name || name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự')
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email không hợp lệ')
    }

    if (!password || password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự')
    }

    if (!role_id) {
      errors.push('Vai trò là bắt buộc')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực',
        errors: errors
      })
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await userModel.findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng',
        errorCode: 'EMAIL_EXISTS'
      })
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12)

    // Tạo user mới
    const user = await userModel.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role_id,
      phone_number: phone_number ? phone_number.trim() : null
    })

    // Không trả về password
    delete user.password

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: user
    })
  } catch (error) {
    console.error('Create user error:', error)

    // Xử lý lỗi cụ thể
    if (error.code === '23505') {
      // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        message: 'Email hoặc số điện thoại đã tồn tại',
        errorCode: 'DUPLICATE_ENTRY'
      })
    }

    if (error.code === '23503') {
      // Foreign key violation
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ',
        errorCode: 'INVALID_ROLE'
      })
    }

    res.status(500).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      errorCode: 'CREATE_USER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.MANAGER]

    if (!profile || !allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
        errorCode: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    const userId = req.params.id
    const { name, email, role_id, active, phone_number } = req.body

    // Kiểm tra user tồn tại
    const existingUser = await userModel.findUserById(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
        errorCode: 'USER_NOT_FOUND'
      })
    }

    // Validation
    const errors = []

    if (name !== undefined && (!name.trim() || name.trim().length < 2)) {
      errors.push('Tên phải có ít nhất 2 ký tự')
    }

    if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email không hợp lệ')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực',
        errors: errors
      })
    }

    // Kiểm tra email trùng (nếu thay đổi email)
    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const emailExists = await userModel.findUserByEmail(email)
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác',
          errorCode: 'EMAIL_EXISTS'
        })
      }
    }

    // Convert active từ string sang boolean nếu cần
    let activeBool = active
    if (active !== undefined) {
      if (typeof active === 'string') {
        activeBool = active.toLowerCase() === 'true'
      } else if (typeof active === 'number') {
        activeBool = active === 1
      }
    }

    // Cập nhật thông tin
    const updatedUser = await userModel.updateUser(userId, {
      name: name ? name.trim() : undefined,
      email: email ? email.toLowerCase().trim() : undefined,
      role_id,
      active: activeBool,
      phone_number:
        phone_number !== undefined ? phone_number.trim() : undefined,
      updated_by: req.user.id // Lưu ai đã update
    })

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    })
  } catch (error) {
    console.error('Update user error:', error)

    // Xử lý lỗi cụ thể
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email hoặc số điện thoại đã tồn tại',
        errorCode: 'DUPLICATE_ENTRY'
      })
    }

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ',
        errorCode: 'INVALID_ROLE'
      })
    }

    res.status(500).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      errorCode: 'UPDATE_USER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    await userModel.deleteUser(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ message: MESSAGES.SERVER_ERROR, error })
  }
}

const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const profile = await userModel.findUserById(req.user.id)

    if (!profile) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(profile)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getProfile
}
