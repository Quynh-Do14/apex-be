const db = require('../config/database')

const getAllUsers = async ({
  search = '',
  active = undefined, // Để undefined để không filter mặc định
  role_id = '',
  limit = 10,
  page = 1
}) => {
  const offset = (page - 1) * limit
  const queryParams = []
  const conditions = []

  let baseQuery = `
    SELECT u.id, u.name, u.email, u.role_id, u.active, 
           u.phone_number, r.name AS role_name, u.created_at 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id
  `

  let countQuery = `
    SELECT COUNT(*) 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id
  `

  // Thêm điều kiện tìm kiếm
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(
      `(LOWER(u.name) LIKE LOWER($${queryParams.length}) OR LOWER(u.email) LIKE LOWER($${queryParams.length}))`
    )
  }

  // Fix: Dùng đúng alias u thay vì p
  if (role_id) {
    queryParams.push(role_id)
    conditions.push(`u.role_id = $${queryParams.length}`)
  }

  // Xử lý boolean active
  if (active) {
    queryParams.push(active)
    conditions.push(`u.active = $${queryParams.length}`)
  }

  // Gắn điều kiện WHERE nếu có
  if (conditions.length > 0) {
    const whereClause = `WHERE ${conditions.join(' AND ')}`
    baseQuery += ` ${whereClause}`
    countQuery += ` ${whereClause}`
  }

  // Thêm ORDER BY trước khi phân trang
  baseQuery += ` ORDER BY u.created_at DESC, u.id DESC`

  // Count query thực hiện trước
  const countResult = await db.query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0]?.count || '0')

  // Thêm phân trang vào data query
  if (limit > 0) {
    queryParams.push(limit)
    queryParams.push(offset)
    baseQuery += ` LIMIT $${queryParams.length - 1} OFFSET $${
      queryParams.length
    }`
  }

  // Thực hiện truy vấn dữ liệu
  const dataResult = await db.query(baseQuery, queryParams)

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 1
  }
}

const createUser = async ({
  name,
  email,
  password,
  role_id,
  phone_number = null // Thêm default value
}) => {
  const query = `
    INSERT INTO users (name, email, password, role_id, phone_number, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, name, email, role_id, phone_number, active, created_at
  `
  const values = [name, email, password, role_id, phone_number]

  const result = await db.query(query, values)
  return result.rows[0]
}

const updateUser = async (
  id,
  { name, email, role_id, active, phone_number = null }
) => {
  // Dynamic query để chỉ update các field được cung cấp
  const updates = []
  const values = []
  let paramCount = 1

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`)
    values.push(name)
    paramCount++
  }

  if (email !== undefined) {
    updates.push(`email = $${paramCount}`)
    values.push(email)
    paramCount++
  }

  if (role_id !== undefined) {
    updates.push(`role_id = $${paramCount}`)
    values.push(role_id)
    paramCount++
  }

  if (active !== undefined) {
    updates.push(`active = $${paramCount}`)
    values.push(active)
    paramCount++
  }

  if (phone_number !== undefined) {
    updates.push(`phone_number = $${paramCount}`)
    values.push(phone_number)
    paramCount++
  }

  // Luôn cập nhật updated_at
  updates.push(`updated_at = NOW()`)

  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  values.push(id) // id là parameter cuối cùng

  const query = `
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, name, email, role_id, active, phone_number, 
              created_at, updated_at
  `

  const result = await db.query(query, values)
  return result.rows[0]
}

const deleteUser = async id => {
  await db.query('DELETE FROM users WHERE id = $1', [id])
}

const findUserByEmail = async email => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0]
}

const findUserById = async id => {
  const result = await db.query(
    `
      SELECT 
        u.id, u.name, u.email, u.role_id, u.active, u.phone_number, u.password, u.created_at,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      `,
    [id]
  )

  return result.rows[0]
}

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
  findUserByEmail,
  findUserById
}
