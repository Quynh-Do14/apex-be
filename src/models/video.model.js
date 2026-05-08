const db = require('../config/database')

const getAllVideos = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM videos WHERE active = true'
  let countQuery = 'SELECT COUNT(*) FROM videos WHERE active = true'
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

const getAllVideosPrivate = async ({
  page = 1,
  limit = 10,
  search = '',
  active
}) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM videos'
  let countQuery = 'SELECT COUNT(*) FROM videos'
  let conditions = []

  // Tìm kiếm theo tên (search)
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(name) LIKE LOWER($${queryParams.length})`)
  }

  if (active) {
    queryParams.push(active)
    conditions.push(`active = $${queryParams.length}`)
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

const getVideoById = async id => {
  const result = await db.query(
    'SELECT * FROM videos WHERE id = $1 AND active = true',
    [id]
  )
  return result.rows[0]
}

const getVideoByIdPrivate = async id => {
  const result = await db.query('SELECT * FROM videos WHERE id = $1', [id])
  return result.rows[0]
}

const createVideo = async ({ name, description, link_url, active }) => {
  const result = await db.query(
    'INSERT INTO videos(name, description, link_url, active) VALUES($1, $2, $3, $4) RETURNING *',
    [name, description, link_url, active]
  )
  return result.rows[0]
}

const updateVideo = async (
  id,
  { name, image, description, link_url, active }
) => {
  const fields = ['name', 'description', 'link_url', 'active']
  const values = [name, description, link_url, active]
  let query =
    'UPDATE videos SET name = $1, description = $2, link_url =$3, active =$4'

  if (image !== undefined && image !== null && image !== '') {
    fields.push('image')
    values.push(image)
    query = 'UPDATE videos SET name = $1, description = $2, link_url = $3'
  }

  query += ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  const result = await db.query(query, values)
  return result.rows[0]
}

const deleteVideo = async id => {
  await db.query('DELETE FROM videos WHERE id = $1', [id])
}

module.exports = {
  getAllVideos,
  getAllVideosPrivate,
  getVideoById,
  getVideoByIdPrivate,
  createVideo,
  updateVideo,
  deleteVideo
}
