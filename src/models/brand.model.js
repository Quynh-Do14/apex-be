const db = require('../config/database')

const getAllBands = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM brands'
  let countQuery = 'SELECT COUNT(*) FROM brands'
  let conditions = []

  // Tìm kiếm theo tên (search)
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(name) LIKE LOWER($${queryParams.length})`)
  }

  // Gắn điều kiện nếu có
  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  // Thêm phân trang
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` ORDER BY id DESC LIMIT $${queryParams.length - 1} OFFSET $${
    queryParams.length
  }`

  // Truy vấn dữ liệu và tổng số dòng
  const dataResult = await db.query(query, queryParams)
  const countResult = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )
  const total = parseInt(countResult.rows[0].count)

  return {
    data: dataResult.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getBrandById = async id => {
  const result = await db.query('SELECT * FROM brands WHERE id = $1', [id])
  return result.rows[0]
}

const createBrand = async ({ name, image }) => {
  const result = await db.query(
    'INSERT INTO brands(name, image) VALUES($1, $2) RETURNING *',
    [name, image]
  )
  return result.rows[0]
}

const updateBrand = async (id, { name, image }) => {
  const fields = ['name']
  const values = [name]
  let query = 'UPDATE brands SET name = $1'

  if (image !== undefined && image !== null && image !== '') {
    fields.push('image')
    values.push(image)
    query = 'UPDATE brands SET name = $1, image = $2'
  }

  query += ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  const result = await db.query(query, values)
  return result.rows[0]
}

const deleteBrand = async id => {
  await db.query('DELETE FROM brands WHERE id = $1', [id])
}

module.exports = {
  getAllBands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
}
