const seriesModel = require('../models/series.model')

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const result = await seriesModel.getAllSerieses({
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
  const series = await seriesModel.getSeriesById(req.params.id)
  if (!series) return res.status(404).json({ message: 'Series not found' })
  res.json(series)
}

const create = async (req, res) => {
  const { name } = req.body
  const series = await seriesModel.createSeries(name)
  res.status(201).json(series)
}

const update = async (req, res) => {
  const { name } = req.body
  const series = await seriesModel.updateSeries(req.params.id, name)
  if (!series) return res.status(404).json({ message: 'Series not found' })
  res.json(series)
}

const remove = async (req, res) => {
  await seriesModel.deleteSeries(req.params.id)
  res.json({ message: 'Series deleted' })
}

module.exports = { getAll, getById, create, update, remove }
