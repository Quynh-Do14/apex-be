const configPageModel = require('../models/config-page.model')
const { ROLES, MESSAGES } = require('../constants')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query
    const result = await configPageModel.getAllConfigPage({
      page,
      limit,
      search,
      type
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getById = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  const data = await configPageModel.getConfigPageById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const create = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  try {
    const { title, description, box_content, type, index } = req.body

    const configPage = await configPageModel.createConfigPage({
      title,
      description,
      box_content,
      type,
      index
    })
    res.status(201).json(configPage)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const update = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  try {
    const { title, description, box_content, type, index } = req.body
    const updated = await configPageModel.updateConfigPage(req.params.id, {
      title,
      description,
      box_content,
      type,
      index
    })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateIndexes = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new Error('Không có quyền thực hiện hành động này', 403)
    }

    const { items } = req.body

    // Validate items
    if (!items || !Array.isArray(items)) {
      throw new Error('Danh sách items không hợp lệ', 400)
    }

    if (items.length === 0) {
      throw new Error('Danh sách items không được để trống', 400)
    }

    if (items.length > 100) {
      throw new Error('Chỉ được cập nhật tối đa 100 items cùng lúc', 400)
    }

    // Kiểm tra trùng lặp ID trong request
    const ids = items.map(item => item.id)
    const uniqueIds = [...new Set(ids)]

    if (ids.length !== uniqueIds.length) {
      throw new Error('Phát hiện ID trùng lặp trong request', 400)
    }

    // Validate từng item
    for (const item of items) {
      if (!item.id || isNaN(parseInt(item.id))) {
        throw new Error(`ID không hợp lệ: ${item.id}`, 400)
      }

      if (
        item.index === undefined ||
        item.index === null ||
        isNaN(parseInt(item.index))
      ) {
        throw new Error(`Số thứ tự không hợp lệ cho ID ${item.id}`, 400)
      }

      const indexNum = parseInt(item.index)
      if (indexNum < 0) {
        throw new Error(`Số thứ tự không được âm cho ID ${item.id}`, 400)
      }
    }

    // Gọi model để cập nhật
    const result = await configPageModel.updateConfigPageIndex(items)

    res.json({
      success: true,
      message: 'Cập nhật số thứ tự thành công',
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

const remove = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  await configPageModel.deleteConfigPage(req.params.id)
  res.json({ message: 'Category deleted' })
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateIndexes,
  remove
}
