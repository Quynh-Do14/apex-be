const db = require('../config/database')
const AppError = require('../utils/AppError')

const getAllProducts = async ({
  page = 1,
  limit = 10,
  search = '',
  category_id,
  brand_id,
  min_price,
  max_price,
  active,
  sub_category_id,
  is_featured
}) => {
  const offset = (page - 1) * limit
  const queryParams = []

  // Data query với đầy đủ conditions
  let query = `
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
  `

  let countQuery = `
    SELECT COUNT(*)
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
  `

  const conditions = ['p.active = true'] // Thêm active vào đây

  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(p.name) LIKE LOWER($${queryParams.length})`)
  }

  if (category_id) {
    queryParams.push(category_id)
    conditions.push(`p.category_id = $${queryParams.length}`)
  }

  if (brand_id) {
    queryParams.push(brand_id)
    conditions.push(`p.brand_id = $${queryParams.length}`)
  }

  if (min_price) {
    queryParams.push(min_price)
    conditions.push(`p.price >= $${queryParams.length}`)
  }

  if (max_price) {
    queryParams.push(max_price)
    conditions.push(`p.price <= $${queryParams.length}`)
  }

  if (sub_category_id) {
    queryParams.push(sub_category_id)
    conditions.push(`p.sub_category_id = $${queryParams.length}`)
  }

  if (is_featured) {
    queryParams.push(is_featured)
    conditions.push(`p.is_featured = $${queryParams.length}`)
  }

  // FIXED: Đúng syntax WHERE clause
  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  // Thêm ORDER BY và pagination
  query += ` ORDER BY p.index ASC`

  // Thêm limit và offset
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`

  // Execute queries
  const [result, count] = await Promise.all([
    db.query(query, queryParams),
    db.query(countQuery, queryParams.slice(0, queryParams.length - 2))
  ])

  // Lấy images (vẫn N+1 nhưng fix logic trước)
  for (let product of result.rows) {
    const imgs = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = $1`,
      [product.id]
    )
    product.images = imgs.rows.map(r => r.image_url)
  }

  const total = parseInt(count.rows[0].count)

  return {
    data: result.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getAllProductsPrivate = async ({
  page = 1,
  limit = 10,
  search = '',
  category_id,
  brand_id,
  min_price,
  max_price,
  active,
  sub_category_id,
  is_featured
}) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = `
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
  `
  let countQuery = `SELECT COUNT(*) FROM products p`
  const conditions = []

  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(p.name) LIKE LOWER($${queryParams.length})`)
  }

  if (category_id) {
    queryParams.push(category_id)
    conditions.push(`p.category_id = $${queryParams.length}`)
  }

  if (brand_id) {
    queryParams.push(brand_id)
    conditions.push(`p.brand_id = $${queryParams.length}`)
  }

  if (min_price) {
    queryParams.push(min_price)
    conditions.push(`p.price >= $${queryParams.length}`)
  }

  if (max_price) {
    queryParams.push(max_price)
    conditions.push(`p.price <= $${queryParams.length}`)
  }

  if (active) {
    queryParams.push(active)
    conditions.push(`p.active = $${queryParams.length}`)
  }

  if (sub_category_id) {
    queryParams.push(sub_category_id)
    conditions.push(`p.sub_category_id = $${queryParams.length}`)
  }

  if (is_featured) {
    queryParams.push(is_featured)
    conditions.push(`p.is_featured = $${queryParams.length}`)
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  queryParams.push(limit, offset)
  query += ` ORDER BY p.id DESC LIMIT $${queryParams.length - 1} OFFSET $${
    queryParams.length
  }`

  const result = await db.query(query, queryParams)
  const count = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )

  for (let product of result.rows) {
    const imgs = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = $1`,
      [product.id]
    )
    product.images = imgs.rows.map(r => r.image_url)
  }

  return {
    data: result.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count.rows[0].count / limit)
  }
}

const getProductById = async id => {
  // 1. Truy vấn thông tin sản phẩm chính
  const productRes = await db.query(
    `
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.slug = $1 AND p.active = true
    `,
    [id]
  )

  const product = productRes.rows[0]
  if (!product) return null

  // 2. Lấy ảnh sản phẩm
  const imageRes = await db.query(
    `SELECT image_url FROM product_images WHERE product_id = $1`,
    [product.id]
  )
  product.images = imageRes.rows.map(r => r.image_url)

  // 3. Lấy danh sách thông số kỹ thuật (figures)
  const figureRes = await db.query(
    `SELECT id, key, value FROM product_figures WHERE product_id = $1`,
    [product.id]
  )
  product.productFigure = figureRes.rows

  // 4. Lấy các sản phẩm cùng danh mục (trừ chính nó)
  const sameCategoryRes = await db.query(
    `
    SELECT name, price, image, slug FROM products
    WHERE category_id = $1 AND id != $2 AND active = true
    ORDER BY created_at DESC
    LIMIT 6
    `,
    [product.category_id, product.id]
  )
  product.sameCategoryProducts = sameCategoryRes.rows

  // 5. Lấy các sản phẩm cùng thương hiệu (trừ chính nó)
  const sameBrandRes = await db.query(
    `
    SELECT * FROM products
    WHERE brand_id = $1 AND id != $2 AND active = true
    ORDER BY created_at DESC
    LIMIT 6
    `,
    [product.brand_id, product.id]
  )

  const productKeyword = await db.query(
    `SELECT id, product_id, keyword FROM product_keyword WHERE product_id = $1`,
    [product.id]
  )
  product.keyword = productKeyword.rows
  product.sameBrandProducts = sameBrandRes.rows

  return product
}

const getProductByIdPrivate = async id => {
  // 1. Truy vấn thông tin sản phẩm chính
  const productRes = await db.query(
    `
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.id = $1
    `,
    [id]
  )

  const product = productRes.rows[0]
  if (!product) return null

  // 2. Lấy ảnh sản phẩm
  const imageRes = await db.query(
    `SELECT image_url FROM product_images WHERE product_id = $1`,
    [id]
  )
  product.images = imageRes.rows.map(r => r.image_url)

  // 3. Lấy danh sách thông số kỹ thuật (figures)
  const figureRes = await db.query(
    `SELECT id, key, value FROM product_figures WHERE product_id = $1`,
    [id]
  )
  const productKeyword = await db.query(
    `SELECT id, product_id, keyword FROM product_keyword WHERE product_id = $1`,
    [id]
  )
  product.keyword = productKeyword.rows
  product.productFigure = figureRes.rows

  return product
}

const createProduct = async (
  data,
  imageUrls = [],
  productFigure = [],
  image = null
) => {
  const {
    name,
    description,
    short_description,
    price,
    price_sale,
    category_id,
    brand_id,
    active,
    index,
    slug,
    keyword,
    sub_category_id,
    is_featured
  } = data

  const existingIndex = await db.query(
    'SELECT id FROM products WHERE index = $1',
    [index]
  )

  if (existingIndex.rows.length > 0) {
    throw new AppError(`Số thứ tự ${index} đã tồn tại`, 400) // ✅ Giữ nguyên
  }

  // 1. Insert sản phẩm
  const result = await db.query(
    `INSERT INTO products (
      name, description, short_description,
      price, price_sale, category_id, brand_id, active, index, slug, 
      sub_category_id, is_featured, image
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING id`,
    [
      name,
      description,
      short_description,
      price,
      price_sale,
      category_id,
      brand_id,
      active,
      index,
      slug,
      (sub_category_id = null),
      is_featured,
      image
    ]
  )

  const productId = result.rows[0].id

  // 2. Insert ảnh phụ
  for (const url of imageUrls) {
    await db.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
      [productId, url]
    )
  }

  // 3. Insert thông số kỹ thuật
  for (const figure of productFigure) {
    await db.query(
      `INSERT INTO product_figures (product_id, key, value) VALUES ($1, $2, $3)`,
      [productId, figure.key, figure.value]
    )
  }
  const keywordList = JSON.parse(keyword || '[]')
  for (const key of keywordList) {
    await db.query(
      `INSERT INTO product_keyword (product_id,keyword) VALUES ($1, $2)`,
      [productId, key]
    )
  }

  return { id: productId }
}

/**
 * Cập nhật product
 */
const updateProduct = async (
  id,
  data,
  newImageUrls = [],
  remainingImages = [],
  productFigure = [],
  image = null // ảnh chính (thumbnail)
) => {
  try {
    const {
      name,
      description,
      short_description,
      price,
      price_sale,
      category_id,
      brand_id,
      active,
      index,
      slug,
      sub_category_id = null,
      is_featured,
      keyword = []
    } = data

    // Kiểm tra product tồn tại
    const checkExist = await db.query('SELECT id FROM products WHERE id = $1', [
      id
    ])

    if (checkExist.rows.length === 0) {
      throw new AppError('Không tìm thấy sản phẩm', 404)
    }

    // Kiểm tra index đã tồn tại chưa (nếu có)
    if (index !== undefined && index !== null) {
      const existingOrder = await db.query(
        'SELECT id FROM products WHERE index = $1 AND id != $2',
        [index, id]
      )

      if (existingOrder.rows.length > 0) {
        throw new AppError(`Số thứ tự ${index} đã tồn tại`, 400) // ✅ Giữ nguyên
      }
    }

    // Xây dựng câu update động
    let updateFields = []
    let params = []
    let paramIndex = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      params.push(name)
      paramIndex++
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`)
      params.push(description)
      paramIndex++
    }

    if (short_description !== undefined) {
      updateFields.push(`short_description = $${paramIndex}`)
      params.push(short_description)
      paramIndex++
    }

    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex}`)
      params.push(price)
      paramIndex++
    }

    if (price_sale !== undefined) {
      updateFields.push(`price_sale = $${paramIndex}`)
      params.push(price_sale)
      paramIndex++
    }

    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`)
      params.push(category_id)
      paramIndex++
    }

    if (brand_id !== undefined) {
      updateFields.push(`brand_id = $${paramIndex}`)
      params.push(brand_id)
      paramIndex++
    }

    if (active !== undefined) {
      updateFields.push(`active = $${paramIndex}`)
      params.push(active)
      paramIndex++
    }

    if (index !== undefined) {
      updateFields.push(`index = $${paramIndex}`)
      params.push(index)
      paramIndex++
    }

    if (slug !== undefined) {
      updateFields.push(`slug = $${paramIndex}`)
      params.push(slug)
      paramIndex++
    }

    if (sub_category_id !== undefined) {
      updateFields.push(`sub_category_id = $${paramIndex}`)
      params.push(sub_category_id)
      paramIndex++
    }

    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex}`)
      params.push(is_featured)
      paramIndex++
    }

    if (image) {
      updateFields.push(`image = $${paramIndex}`)
      params.push(image)
      paramIndex++
    }

    // Thêm id vào params
    params.push(id)

    const updateQuery = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await db.query(updateQuery, params)

    // Cập nhật ảnh phụ
    if (newImageUrls.length > 0 || remainingImages.length > 0) {
      const oldImagesRes = await db.query(
        `SELECT image_url FROM product_images WHERE product_id = $1`,
        [id]
      )
      const oldImages = oldImagesRes.rows.map(row => row.image_url)

      const imagesToDelete = oldImages.filter(
        url => !remainingImages.includes(url)
      )
      for (const url of imagesToDelete) {
        await db.query(
          `DELETE FROM product_images WHERE product_id = $1 AND image_url = $2`,
          [id, url]
        )
      }

      for (const url of newImageUrls) {
        await db.query(
          `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)`,
          [id, url]
        )
      }
    }

    // Cập nhật thông số kỹ thuật
    if (productFigure.length > 0) {
      await db.query(`DELETE FROM product_figures WHERE product_id = $1`, [id])
      for (const figure of productFigure) {
        await db.query(
          `INSERT INTO product_figures (product_id, key, value) VALUES ($1, $2, $3)`,
          [id, figure.key, figure.value]
        )
      }
    }
    const keywordList = JSON.parse(keyword || '[]')
    await db.query(`DELETE FROM product_keyword WHERE product_id = $1`, [id])
    for (const key of keywordList) {
      await db.query(
        `INSERT INTO product_keyword (product_id, keyword) VALUES ($1, $2)`,
        [id, key]
      )
    }

    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) throw error
    console.error('Lỗi khi cập nhật sản phẩm:', error)
    throw new AppError('Lỗi server khi cập nhật sản phẩm', 500)
  }
}

const updateProductIndex = async items => {
  try {
    // Validate dữ liệu trước
    for (const item of items) {
      const { id, index } = item

      if (!id || isNaN(parseInt(id))) {
        throw new AppError(`ID không hợp lệ: ${id}`, 400)
      }

      if (index === undefined || index === null || isNaN(parseInt(index))) {
        throw new AppError(`Thứ tự hiển thị không hợp lệ cho ID ${id}`, 400)
      }
    }

    // Lấy danh sách ID để kiểm tra tồn tại
    const ids = items.map(item => item.id)
    const checkExist = await db.query(
      'SELECT id FROM products WHERE id = ANY($1::int[])',
      [ids]
    )

    if (checkExist.rows.length !== ids.length) {
      const existingIds = checkExist.rows.map(row => row.id)
      const notFoundIds = ids.filter(id => !existingIds.includes(id))
      throw new AppError(
        `Không tìm thấy sản phẩm với ID: ${notFoundIds.join(', ')}`,
        404
      )
    }

    // Kiểm tra index không trùng nhau trong request
    const orders = items.map(item => item.index)
    const uniqueOrders = [...new Set(orders)]
    if (orders.length !== uniqueOrders.length) {
      throw new AppError(
        'Các thứ tự hiển thị không được trùng nhau trong request',
        400
      )
    }

    // Kiểm tra index không bị trùng với sản phẩm khác ngoài danh sách đang cập nhật
    const existingOrder = await db.query(
      'SELECT index FROM products WHERE index = ANY($1::int[]) AND id != ALL($2::int[])',
      [orders, ids]
    )

    if (existingOrder.rows.length > 0) {
      const duplicateOrders = existingOrder.rows.map(row => row.index)
      throw new AppError(
        `Các thứ tự hiển thị ${duplicateOrders.join(
          ', '
        )} đã tồn tại ở sản phẩm khác`,
        400
      )
    }

    // Xây dựng câu query CASE WHEN để cập nhật tất cả cùng lúc
    let caseWhen = ''
    let params = []
    let paramIndex = 1

    items.forEach((item, i) => {
      caseWhen += `WHEN id = $${paramIndex} THEN $${paramIndex + 1} `
      params.push(item.id, item.index)
      paramIndex += 2
    })

    const query = `
      UPDATE products 
      SET index = CASE 
        ${caseWhen}
        ELSE index 
      END
      WHERE id IN (${items.map((_, i) => `$${i * 2 + 1}`).join(', ')})
      RETURNING id, index, name
    `

    const result = await db.query(query, params)

    return {
      success: true,
      message: 'Cập nhật thứ tự hiển thị thành công',
      data: result.rows
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    console.error('Lỗi khi cập nhật thứ tự hiển thị hàng loạt:', error)
    throw new AppError('Lỗi server khi cập nhật thứ tự hiển thị', 500)
  }
}

const deleteProduct = async id => {
  await db.query(`DELETE FROM products WHERE id = $1`, [id])
}

module.exports = {
  getAllProducts,
  getAllProductsPrivate,
  getProductById,
  getProductByIdPrivate,
  createProduct,
  updateProduct,
  updateProductIndex,
  deleteProduct
}
