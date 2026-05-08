const db = require('../config/database')

const getAllContacs = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM contacts'
  let countQuery = 'SELECT COUNT(*) FROM contacts'
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

const getContactById = async id => {
  const result = await db.query('SELECT * FROM contacts WHERE id = $1', [id])
  return result.rows[0]
}

const createContact = async (name, email, phone_number, message) => {
  const result = await db.query(
    'INSERT INTO contacts(name, email, phone_number, message) VALUES($1, $2, $3, $4) RETURNING *',
    [name, email, phone_number, message]
  )
  return result.rows[0]
}

const updateContact = async (id, status) => {
  const result = await db.query(
    'UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  )
  return result.rows[0]
}

const deleteContact = async id => {
  await db.query('DELETE FROM contacts WHERE id = $1', [id])
}

module.exports = {
  getAllContacs,
  getContactById,
  createContact,
  updateContact,
  deleteContact
}
