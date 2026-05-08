const { ROLES } = require('../constants')
const agencyModel = require('../models/agency.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      province = '',
      district = '',
      star_rate = '',
      category_id = ''
    } = req.query
    const result = await agencyModel.getAllAgency({
      page,
      limit,
      search,
      province,
      district,
      star_rate,
      category_id
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getAllPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      province = '',
      district = '',
      star_rate = '',
      category_id = '',
      active
    } = req.query
    const result = await agencyModel.getAllAgencyPrivate({
      page,
      limit,
      search,
      province,
      district,
      star_rate,
      category_id,
      active
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getById = async (req, res) => {
  try {
    const data = await agencyModel.getAgencyById(req.params.id)
    if (!data) return res.status(404).json({ message: 'Agency not found' })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }
  try {
    const data = await agencyModel.getAgencyByIdPrivate(req.params.id)
    if (!data) return res.status(404).json({ message: 'Agency not found' })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const create = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    const {
      name,
      address,
      lat,
      long,
      phone_number,
      phone_number_2,
      phone_number_3,
      province,
      district,
      star_rate,
      active,
      agency_categories_type
    } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : null

    // Validate required fields
    if (!name || !address || !phone_number || !province || !district) {
      return res
        .status(400)
        .json({ message: 'Name, address and phone number are required' })
    }

    const agencyCategoryType = JSON.parse(agency_categories_type || '[]')

    const newAgency = await agencyModel.createAgency({
      name,
      address,
      lat,
      long,
      phone_number,
      phone_number_2,
      phone_number_3,
      province,
      district,
      star_rate,
      active,
      agency_categories_type: agencyCategoryType,
      image
    })
    res.status(201).json(newAgency)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const {
      name,
      address,
      lat,
      long,
      phone_number,
      phone_number_2,
      phone_number_3,
      province,
      district,
      star_rate,
      agency_categories_type,
      active
    } = req.body
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || undefined

    const agencyCategoryType = JSON.parse(agency_categories_type || '[]')

    const updateData = {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(lat !== undefined && { lat: parseFloat(lat) }),
      ...(long !== undefined && { long: parseFloat(long) }),
      ...(phone_number !== undefined && { phone_number }),
      ...(phone_number_2 !== undefined && { phone_number_2 }),
      ...(phone_number_3 !== undefined && { phone_number_3 }),
      ...(province !== undefined && { province }),
      ...(star_rate !== undefined && { star_rate }),
      ...(district !== undefined && { district }),
      ...(active !== undefined && { active }),
      ...(agencyCategoryType !== undefined && {
        agency_categories_type: agencyCategoryType
      }),
      ...(image !== undefined && { image })
    }

    const updated = await agencyModel.updateAgency(req.params.id, updateData)
    if (!updated) return res.status(404).json({ message: 'Agency not found' })
    res.json(updated)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const agency = await agencyModel.getAgencyById(req.params.id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })

    await agencyModel.deleteAgency(req.params.id)
    res.json({ message: 'Agency deleted successfully' })
  } catch (error) {
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
