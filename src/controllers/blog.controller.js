const { ROLES, MESSAGES } = require('../constants')
const blogModel = require('../models/blog.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category_id } = req.query

    const result = await blogModel.getAllBLog({
      page,
      limit,
      search,
      category_id
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getAllPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  try {
    const { page = 1, limit = 10, search = '', category_id, active } = req.query

    const result = await blogModel.getAllBLogPrivate({
      page,
      limit,
      search,
      category_id,
      active
    })
    res.json(result)
  } catch (error) {
    console.error(err)
    next(err)
  }
}

const getById = async (req, res) => {
  const item = await blogModel.getBLogById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Không tìm thấy tin tức' })
  res.json(item)
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }

  const item = await blogModel.getBLogByIdPrivate(req.params.id)
  if (!item) return res.status(404).json({ message: 'Không tìm thấy tin tức' })
  res.json(item)
}

const create = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const {
      title,
      description,
      short_description,
      blog_category_id,
      active,
      is_draft,
      slug,
      keyword
    } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : null
    const keywordList = JSON.parse(keyword || '[]')

    const blog = await blogModel.createBLog({
      title,
      description,
      short_description,
      blog_category_id,
      active,
      image,
      is_draft,
      user_id: req.user.id,
      slug,
      keyword: keywordList
    })
    res.status(201).json(blog)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]
    console.log('req.user.id', req.user.id)

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const {
      title,
      description,
      short_description,
      blog_category_id,
      active,
      is_draft,
      slug,
      keyword
    } = req.body
    const keywordList = JSON.parse(keyword || '[]')
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || null
    const blog = await blogModel.updateBLog(req.params.id, {
      title,
      description,
      short_description,
      blog_category_id,
      active,
      is_draft,
      slug,
      keyword: keywordList,
      image
    })
    res.status(201).json(blog)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    await blogModel.deleteBLog(req.params.id)
    res.json({ message: 'Đã xoá tin tức' })
  } catch (err) {
    console.error(err)
    next(err)
  }
}

module.exports = {
  getAll,
  getAllPrivate,
  getById,
  getByIdPrivate,
  create,
  update,
  remove
}
