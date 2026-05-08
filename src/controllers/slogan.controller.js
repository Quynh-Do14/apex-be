const { ROLES } = require('../constants')
const sloganModel = require('../models/slogan.model')
const AppError = require('../utils/AppError')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await sloganModel.getAllSlogan({ page, limit, search })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getAllPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    throw new AppError('Không có quyền thực hiện hành động này', 403)
  }

  try {
    const { page = 1, limit = 10, search = '', active = '' } = req.query

    const result = await sloganModel.getAllSloganPrivate({
      page,
      limit,
      search,
      active
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getById = async (req, res) => {
  const data = await sloganModel.getSloganById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    throw new AppError('Không có quyền thực hiện hành động này', 403)
  }

  const data = await sloganModel.getSloganByIdPrivate(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const create = async (req, res, next) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    throw new AppError('Không có quyền thực hiện hành động này', 403)
  }
  try {
    const { name, description, type, index, active } = req.body

    // Validate dữ liệu đầu vào
    if (!name || name.trim() === '') {
      throw new AppError('Tiêu đề là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError('Tiêu đề không được vượt quá 255 ký tự', 400)
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null

    const newSlogan = await sloganModel.createSlogan({
      name: name.trim(),
      description: description ? description.trim() : null,
      type,
      index,
      active,
      image
    })

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: newSlogan
    })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null
    const { id } = req.params
    const { name, description, type, index, active } = req.body

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    if (!name || name.trim() === '') {
      throw new AppError('Tiêu đề là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError('Tiêu đề không được vượt quá 255 ký tự', 400)
    }

    const Slogan = await sloganModel.updateSlogan(
      id,
      name.trim(),
      description,
      type,
      index,
      active,
      image
    )

    if (!Slogan) {
      throw new AppError('Không tìm thấy danh mục blog', 404)
    }

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: Slogan
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cập nhật index hàng loạt cho nhiều slogan
 * API endpoint: PUT /api/slogans/update-indexes
 * Body: { items: [{ id: 1, index: 1 }, { id: 2, index: 2 }] }
 */
const updateIndexes = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }

    const { items } = req.body

    // Validate items
    if (!items || !Array.isArray(items)) {
      throw new AppError('Danh sách items không hợp lệ', 400)
    }

    if (items.length === 0) {
      throw new AppError('Danh sách items không được để trống', 400)
    }

    if (items.length > 100) {
      throw new AppError('Chỉ được cập nhật tối đa 100 items cùng lúc', 400)
    }

    // Kiểm tra trùng lặp ID trong request
    const ids = items.map(item => item.id)
    const uniqueIds = [...new Set(ids)]

    if (ids.length !== uniqueIds.length) {
      throw new AppError('Phát hiện ID trùng lặp trong request', 400)
    }

    // Kiểm tra trùng lặp index trong request
    const indexes = items.map(item => item.index)
    const uniqueIndexes = [...new Set(indexes)]

    if (indexes.length !== uniqueIndexes.length) {
      throw new AppError('Phát hiện số thứ tự trùng lặp trong request', 400)
    }

    // Validate từng item
    for (const item of items) {
      if (!item.id || isNaN(parseInt(item.id))) {
        throw new AppError(`ID không hợp lệ: ${item.id}`, 400)
      }

      if (
        item.index === undefined ||
        item.index === null ||
        isNaN(parseInt(item.index))
      ) {
        throw new AppError(`Số thứ tự không hợp lệ cho ID ${item.id}`, 400)
      }

      const indexNum = parseInt(item.index)
      if (indexNum < 0) {
        throw new AppError(`Số thứ tự không được âm cho ID ${item.id}`, 400)
      }
    }

    // Gọi model để cập nhật
    const result = await sloganModel.updateSloganIndexes(items)

    res.json({
      success: true,
      message: 'Cập nhật số thứ tự thành công',
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

const remove = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    // Kiểm tra xem danh mục có tồn tại không
    const SloganExists = await sloganModel.getSloganByIdPrivate(id)
    if (!SloganExists) {
      throw new AppError('Không tìm thấy danh mục', 404)
    }

    // Gọi hàm xóa - nếu có lỗi sẽ throw AppError trong model
    const result = await sloganModel.deleteSlogan(id)

    res.json({
      success: true,
      message: result.message || 'Xóa danh mục thành công',
      data: result.data || null
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAll,
  getAllPrivate,
  getById,
  getByIdPrivate,
  create,
  update,
  updateIndexes,
  remove
}
