const agencyCategoryModel = require('../models/agency-category.model')
const AppError = require('../utils/AppError')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await agencyCategoryModel.getAllCategories({
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
  const data = await agencyCategoryModel.getCategoryById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const create = async (req, res, next) => {
  try {
    const { name } = req.body

    if (!name || name.trim() === '') {
      throw new AppError('Tên danh mục đại lý là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError(
        'Tên danh mục đại lý không được vượt quá 255 ký tự',
        400
      )
    }

    const newCategory = await agencyCategoryModel.createCategory({
      name: name.trim()
    })

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục đại lý thành công',
      data: newCategory
    })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    if (!name || name.trim() === '') {
      throw new AppError('Tên danh mục đại lý là bắt buộc', 400)
    }

    if (name.length > 255) {
      throw new AppError(
        'Tên danh mục đại lý không được vượt quá 255 ký tự',
        400
      )
    }

    const updated = await agencyCategoryModel.updateCategory(id, {
      name: name.trim()
    })

    res.json({
      success: true,
      message: 'Cập nhật danh mục đại lý thành công',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

const remove = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      throw new AppError('ID không hợp lệ', 400)
    }

    const result = await agencyCategoryModel.deleteCategory(id)

    res.json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
}
