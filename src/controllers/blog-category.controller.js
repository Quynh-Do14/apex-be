const { ROLES } = require('../constants')
const blogCategoryModel = require('../models/blog-category.model')
const userModel = require('../models/user.model')
const AppError = require('../utils/AppError')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await blogCategoryModel.getAllCategories({
      page,
      limit,
      search
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}
const getById = async (req, res) => {
  const category = await blogCategoryModel.getCategoryById(req.params.id)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json(category)
}

const getByIdPrivate = async (req, res) => {
  const category = await blogCategoryModel.getCategoryByIdPrivate(req.params.id)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json(category)
}

const create = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }

    // Validate input
    const { name } = req.body

    if (!name || name.trim() === '') {
      throw new AppError('Tên danh mục blog là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError('Tên danh mục blog không được vượt quá 255 ký tự', 400)
    }

    const category = await blogCategoryModel.createCategory(name.trim())

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục blog thành công',
      data: category
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

    const { id } = req.params
    const { name } = req.body

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    if (!name || name.trim() === '') {
      throw new AppError('Tên danh mục blog là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError('Tên danh mục blog không được vượt quá 255 ký tự', 400)
    }

    const category = await blogCategoryModel.updateCategory(id, name.trim())

    if (!category) {
      throw new AppError('Không tìm thấy danh mục blog', 404)
    }

    res.json({
      success: true,
      message: 'Cập nhật danh mục blog thành công',
      data: category
    })
  } catch (error) {
    next(error)
  }
}

const remove = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }

    const { id } = req.params

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await blogCategoryModel.getCategoryById(id)
    if (!categoryExists) {
      throw new AppError('Không tìm thấy danh mục blog', 404)
    }

    const result = await blogCategoryModel.deleteCategory(id)

    res.json({
      success: true,
      message: result.message || 'Xóa danh mục blog thành công',
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAll,
  getById,
  getByIdPrivate,
  create,
  update,
  remove
}
