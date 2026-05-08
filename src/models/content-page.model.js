const db = require('../config/database')

const getAllContentPage = async ({ page = 1, limit = 10, type = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM content_page'
  let countQuery = 'SELECT COUNT(*) FROM content_page'
  let conditions = []

  if (type) {
    queryParams.push(type)  // Thêm vào queryParams thay vì values
    conditions.push(`type = $${queryParams.length}`)  // Dùng queryParams.length
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

const getContentPageById = async id => {
  const result = await db.query('SELECT * FROM content_page WHERE id = $1', [
    id
  ])
  return result.rows[0]
}

const createContentPage = async ({ type, content }) => {
  const existingIndex = await db.query(
    'SELECT id FROM content_page WHERE type = $1',
    [type]
  )

  if (existingIndex.rows.length > 0) {
    throw new Error(`Trang này đã có nội dung`, 400)
  }
  const result = await db.query(
    'INSERT INTO content_page(type, content) VALUES($1, $2) RETURNING *',
    [type, content]
  )
  return result.rows[0]
}

const updateContentPage = async (id, { type, content }) => {
  const existingIndex = await db.query(
    'SELECT id FROM content_page WHERE type = $1 AND id != $2',
    [type, id]
  )

  if (existingIndex.rows.length > 0) {
    throw new Error(`Trang này đã có nội dung`, 400)
  }

  const fields = ['type', 'content']
  const values = [type, content]
  let query = 'UPDATE content_page SET type = $1, content = $2'

  query += ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  const result = await db.query(query, values)
  return result.rows[0]
}

const deleteContentPage = async id => {
  await db.query('DELETE FROM content_page WHERE id = $1', [id])
}

module.exports = {
  getAllContentPage,
  getContentPageById,
  createContentPage,
  updateContentPage,
  deleteContentPage
}
