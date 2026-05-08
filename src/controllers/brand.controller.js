const brandModel = require('../models/brand.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await brandModel.getAllBands({ page, limit, search })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

const getById = async (req, res) => {
  const data = await brandModel.getBrandById(req.params.id)
  if (!data) return res.status(404).json({ message: 'Not found' })
  res.json(data)
}

const create = async (req, res) => {
  try {
    const { name } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : null

    const newBrand = await brandModel.createBrand({
      name,
      image
    })
    res.status(201).json(newBrand)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const update = async (req, res) => {
  try {
    const { name } = req.body
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || null

    const updated = await brandModel.updateBrand(req.params.id, {
      name,
      image
    })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const remove = async (req, res) => {
  await brandModel.deleteBrand(req.params.id)
  res.json({ message: 'Brand deleted' })
}

module.exports = { getAll, getById, create, update, remove }
