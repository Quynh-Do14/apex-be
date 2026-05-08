const db = require('../config/database')

const getAllProductsSeries = async ({
  page = 1,
  limit = 10,
  search = '',
  product_id
}) => {
  const offset = (page - 1) * limit
  const queryParams = []

  // Query chính để lấy danh sách product_series
  let query = `
    SELECT ps.*, p.name AS product_name, s.name AS series_name
    FROM product_series ps
    LEFT JOIN products p ON ps.product_id = p.id
    LEFT JOIN series s ON ps.series_id = s.id
  `

  let countQuery = `
    SELECT COUNT(*) 
    FROM product_series ps
    LEFT JOIN products p ON ps.product_id = p.id
  `

  const conditions = []

  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(ps.name) LIKE LOWER($${queryParams.length})`)
  }

  if (product_id) {
    queryParams.push(product_id)
    conditions.push(`ps.product_id = $${queryParams.length}`)
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  query += ` ORDER BY ps.created_at DESC`

  // Phân trang
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`

  // Truy vấn dữ liệu chính
  const result = await db.query(query, queryParams)

  // Lấy tổng số bản ghi
  const countResult = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )
  const total = parseInt(countResult.rows[0].count)

  // Nếu không có dữ liệu, trả về kết quả rỗng
  if (result.rows.length === 0) {
    return {
      data: [],
      total: 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: 0
    }
  }

  // Lấy tất cả product_series_id từ kết quả
  const productSeriesIds = result.rows.map(row => row.id)

  // Truy vấn tất cả figures cho các product_series_id một lần
  const figureRes = await db.query(
    `SELECT product_series_id, id, key, value 
     FROM product_series_figures 
     WHERE product_series_id = ANY($1) 
     ORDER BY product_series_id, id`,
    [productSeriesIds]
  )

  // Nhóm figures theo product_series_id
  const figuresByProductSeriesId = {}
  figureRes.rows.forEach(figure => {
    if (!figuresByProductSeriesId[figure.product_series_id]) {
      figuresByProductSeriesId[figure.product_series_id] = []
    }
    figuresByProductSeriesId[figure.product_series_id].push({
      id: figure.id,
      key: figure.key,
      value: figure.value
    })
  })

  // Gán figures vào từng product_series
  const productsWithFigures = result.rows.map(product => {
    return {
      ...product,
      productFigure: figuresByProductSeriesId[product.id] || []
    }
  })

  return {
    data: productsWithFigures,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getProductSeriesById = async id => {
  // 1. Truy vấn thông tin sản phẩm chính
  const productRes = await db.query(
    `
    SELECT ps.*, ps.name AS name, s.name AS series_name
    FROM product_series ps
    LEFT JOIN products p ON ps.product_id = p.id
    LEFT JOIN series s ON ps.series_id = s.id
    WHERE ps.id = $1
    `,
    [id]
  )

  const product = productRes.rows[0]
  if (!product) return null

  // 3. Lấy danh sách thông số kỹ thuật (figures)
  const figureRes = await db.query(
    `SELECT id, key, value FROM product_series_figures WHERE product_series_id = $1`,
    [id]
  )
  product.productFigure = figureRes.rows

  return product
}

const createProductSeries = async (data, productFigure = [], image = null) => {
  const { name, product_id, series_id } = data
  // console.log('data', data)
  // console.log('productFigure', productFigure)
  // console.log('image', image)
  // 1. Insert sản phẩm
  const result = await db.query(
    `INSERT INTO product_series (
      name, product_id, series_id, image
    ) VALUES ($1,$2,$3,$4)
    RETURNING id`,
    [name, product_id, series_id, image]
  )

  const productId = result.rows[0].id

  // 3. Insert thông số kỹ thuật
  for (const figure of productFigure) {
    await db.query(
      `INSERT INTO product_series_figures (product_series_id, key, value) VALUES ($1, $2, $3)`,
      [productId, figure.key, figure.value]
    )
  }

  return result.rows[0]
}

const updateProductSeries = async (
  id,
  data,
  productFigure = [],
  image = null // ảnh chính (thumbnail)
) => {
  const { name, product_id, series_id } = data

  let updateQuery = `
    UPDATE product_series SET 
      name=$1, 
      product_id=$2,
      series_id=$3`
  const params = [name, product_id, series_id]

  if (image) {
    updateQuery += `, image=$4`
    params.push(image)
    updateQuery += ` WHERE id=$5 RETURNING *`
    params.push(id)
  } else {
    updateQuery += ` WHERE id=$4 RETURNING *`
    params.push(id)
  }

  const result = await db.query(updateQuery, params)

  // Cập nhật thông số kỹ thuật
  await db.query(
    `DELETE FROM product_series_figures WHERE product_series_id = $1`,
    [id]
  )
  for (const figure of productFigure) {
    await db.query(
      `INSERT INTO product_series_figures (product_series_id, key, value) VALUES ($1, $2, $3)`,
      [id, figure.key, figure.value]
    )
  }

  return result.rows[0]
}

const deleteProductSeries = async id => {
  await db.query(`DELETE FROM product_series WHERE id = $1`, [id])
}

module.exports = {
  getAllProductsSeries,
  getProductSeriesById,
  createProductSeries,
  updateProductSeries,
  deleteProductSeries
}
