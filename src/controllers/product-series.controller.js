const { ROLES, MESSAGES } = require('../constants')
const productSeriesModel = require('../models/product-series.model')
const userModel = require('../models/user.model')

const getAll = async (req, res) => {
  try {
    const { page, limit, search, product_id } = req.query
    const result = await productSeriesModel.getAllProductsSeries({
      page,
      limit,
      search,
      product_id
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message })
  }
}

const getById = async (req, res) => {
  const product = await productSeriesModel.getProductSeriesById(req.params.id)
  if (!product)
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
  res.json(product)
}

const create = async (req, res) => {

  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    // ✅ Lấy ảnh chính (image)
    const image = req.file ? `/uploads/${req.file.filename}` : null

    // ✅ Parse productFigure từ body
    const productFigure = JSON.parse(req.body.productFigure || '[]')

    // ✅ Tạo sản phẩm
    const product = await productSeriesModel.createProductSeries(
      req.body,
      productFigure,
      image // 👈 Truyền thêm ảnh chính
    )

    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    res
      .status(500)
      .json({ message: 'Tạo sản phẩm thất bại', error: err.message })
  }
}

const update = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const productFigure = JSON.parse(req.body.productFigure || '[]')

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || null

    const product = await productSeriesModel.updateProductSeries(
      req.params.id,
      req.body,
      productFigure,
      image
    )

    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })

    res.json(product)
  } catch (err) {
    res.status(500).json({ message: 'Cập nhật thất bại', error: err.message })
  }
}

const remove = async (req, res) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    await productSeriesModel.deleteProductSeries(req.params.id)
    res.json({ message: 'Đã xoá sản phẩm' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: err.message })
  }
}

module.exports = { getAll, getById, create, update, remove }
