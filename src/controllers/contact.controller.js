const { ROLES } = require('../constants')
const contactModel = require('../models/contact.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const { page = 1, limit = 10, search = '' } = req.query

    const result = await contactModel.getAllContacs({
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
  const category = await contactModel.getContactById(req.params.id)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json(category)
}

const create = async (req, res) => {
  const { name, email, phone_number, message } = req.body
  const category = await contactModel.createContact(
    name,
    email,
    phone_number,
    message
  )
  res.status(201).json(category)
}

const updateStatus = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name))
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  const { status } = req.body
  const category = await contactModel.updateContact(req.params.id, status)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json(category)
}

const remove = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name))
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

  await contactModel.deleteContact(req.params.id)
  res.json({ message: 'Category deleted' })
}

module.exports = { getAll, getById, create, updateStatus, remove }
