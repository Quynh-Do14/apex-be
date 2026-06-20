const { ROLES, MESSAGES } = require('../constants')
const productModel = require('../models/product.model')
const userModel = require('../models/user.model')
const AppError = require('../utils/AppError')
const getAll = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      active,
      sub_category_id,
      is_featured
    } = req.query
    const result = await productModel.getAllProducts({
      page,
      limit,
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      active,
      sub_category_id,
      is_featured
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message })
  }
}

const getAllPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name))
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

  try {
    const {
      page,
      limit,
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      active,
      sub_category_id,
      is_feature
    } = req.query
    const result = await productModel.getAllProductsPrivate({
      page,
      limit,
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      active,
      sub_category_id,
      is_feature
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message })
  }
}

const getById = async (req, res) => {
  const product = await productModel.getProductById(req.params.id)
  if (!product)
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
  res.json(product)
}

const getByIdPrivate = async (req, res) => {
  const profile = await userModel.findUserById(req.user.id)
  const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

  if (!allowedRoles.includes(profile.role_name)) {
    return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
  }

  const product = await productModel.getProductByIdPrivate(req.params.id)
  if (!product)
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
  res.json(product)
}

const create = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })
    }

    // ✅ Lấy ảnh chính (image)
    const image = req.files?.image?.[0]
      ? `/uploads/${req.files.image[0].filename}`
      : null

    // ✅ Lấy danh sách ảnh phụ (images)
    const imageUrls =
      req.files?.images?.map(file => `/uploads/${file.filename}`) || []

    // ✅ Parse productFigure từ body
    const productFigure = JSON.parse(req.body.productFigure || '[]')

    // ✅ Tạo sản phẩm
    const product = await productModel.createProduct(
      req.body,
      imageUrls,
      productFigure,
      image // 👈 Truyền thêm ảnh chính
    )

    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    const newImageUrls =
      req.files?.images?.map(file => `/uploads/${file.filename}`) || []

    const remainingImages = JSON.parse(req.body.remainingImages || '[]')

    const productFigure = JSON.parse(req.body.productFigure || '[]')

    // Ảnh chính (image: chỉ lấy phần tử đầu tiên nếu tồn tại)
    const singleImage = req.files?.image?.[0]
      ? `/uploads/${req.files.image[0].filename}`
      : null

    const product = await productModel.updateProduct(
      req.params.id,
      req.body,
      newImageUrls,
      remainingImages,
      productFigure,
      singleImage // 👉 truyền thêm vào
    )

    if (!product)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })

    res.json(product)
  } catch (err) {
    next(err)
  }
}

const updateIndexes = async (req, res, next) => {
  try {
    // Kiểm tra quyền truy cập
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name)) {
      throw new AppError('Không có quyền thực hiện hành động này', 403)
    }

    const { items } = req.body

    // Validate items
    if (!items || !Array.isArray(items)) {
      throw new AppError('Danh sách items không hợp lệ', 400)
    }

    if (items.length === 0) {
      throw new AppError('Danh sách items không được để trống', 400)
    }

    if (items.length > 100) {
      throw new AppError('Chỉ được cập nhật tối đa 100 items cùng lúc', 400)
    }

    // Kiểm tra trùng lặp ID trong request
    const ids = items.map(item => item.id)
    const uniqueIds = [...new Set(ids)]

    if (ids.length !== uniqueIds.length) {
      throw new AppError('Phát hiện ID trùng lặp trong request', 400)
    }

    // Kiểm tra trùng lặp index trong request
    const indexes = items.map(item => item.index)
    const uniqueIndexes = [...new Set(indexes)]

    if (indexes.length !== uniqueIndexes.length) {
      throw new AppError('Phát hiện số thứ tự trùng lặp trong request', 400)
    }

    // Validate từng item
    for (const item of items) {
      if (!item.id || isNaN(parseInt(item.id))) {
        throw new AppError(`ID không hợp lệ: ${item.id}`, 400)
      }

      if (
        item.index === undefined ||
        item.index === null ||
        isNaN(parseInt(item.index))
      ) {
        throw new AppError(`Số thứ tự không hợp lệ cho ID ${item.id}`, 400)
      }

      const indexNum = parseInt(item.index)
      if (indexNum < 0) {
        throw new AppError(`Số thứ tự không được âm cho ID ${item.id}`, 400)
      }
    }

    // Gọi model để cập nhật
    const result = await productModel.updateProductIndex(items)

    res.json({
      success: true,
      message: 'Cập nhật số thứ tự thành công',
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

const remove = async (req, res, next) => {
  try {
    const profile = await userModel.findUserById(req.user.id)
    const allowedRoles = [ROLES.ADMIN, ROLES.SELLER]

    if (!allowedRoles.includes(profile.role_name))
      return res.status(403).json({ message: MESSAGES.UNAUTHORIZED })

    await productModel.deleteProduct(req.params.id)
    res.json({ message: 'Đã xoá sản phẩm' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAll,
  getAllPrivate,
  getById,
  getByIdPrivate,
  create,
  update,
  updateIndexes,
  remove
}
