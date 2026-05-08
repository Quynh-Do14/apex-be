const bannerModel = require('../models/banner.model')
const { ROLES, MESSAGES } = require('../constants')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query
    const result = await bannerModel.getAllBanner({ page, limit, search, type })
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
    const { page = 1, limit = 10, search = '', type = '', active } = req.query
    const result = await bannerModel.getAllBannerPrivate({
      page,
      limit,
      search,
      type,
      active
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getById = async (req, res) => {
  const data = await bannerModel.getBannerById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  const data = await bannerModel.getBannerByIdPrivate(req.params.id)
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
    const { name, type, active } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : null

    const newCategory = await bannerModel.createBanner({
      name,
      type,
      active,
      image
    })
    res.status(201).json(newCategory)
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
    const { name, type, active } = req.body
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || null

    const updated = await bannerModel.updateBanner(req.params.id, {
      name,
      type,
      active,
      image
    })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const remove = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  await bannerModel.deleteBanner(req.params.id)
  res.json({ message: 'Category deleted' })
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
