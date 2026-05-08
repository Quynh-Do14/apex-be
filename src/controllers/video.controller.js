const videoModel = require('../models/video.model')
const userModel = require('../models/user.model')
const { ROLES, MESSAGES } = require('../constants')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await videoModel.getAllVideos({ page, limit, search })
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
    const { page = 1, limit = 10, search = '', active } = req.query

    const result = await videoModel.getAllVideosPrivate({
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
  const data = await videoModel.getVideoById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.WRITTER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  const data = await videoModel.getVideoByIdPrivate(req.params.id)
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
    const { name, description, link_url, active } = req.body
    const newCategory = await videoModel.createVideo({
      name,
      description,
      link_url,
      active
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
    const { name, description, link_url, active } = req.body
    const updated = await videoModel.updateVideo(req.params.id, {
      name,
      description,
      link_url,
      active
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
  await videoModel.deleteVideo(req.params.id)
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
