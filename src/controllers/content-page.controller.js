const contentPageModel = require('../models/content-page.model')
const userModel = require('../models/user.model')
const { ROLES, MESSAGES } = require('../constants')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '' } = req.query

    const result = await contentPageModel.getAllContentPage({
      page,
      limit,
      type
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getById = async (req, res) => {
  const data = await contentPageModel.getContentPageById(req.params.id)
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
    const { type, content } = req.body
    const newCategory = await contentPageModel.createContentPage({
      type,
      content
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
    const { type, content } = req.body
    const updated = await contentPageModel.updateContentPage(req.params.id, {
      type,
      content
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
  await contentPageModel.deleteContentPage(req.params.id)
  res.json({ message: 'Category deleted' })
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
}
