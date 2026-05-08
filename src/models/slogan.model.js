const db = require('../config/database')
const AppError = require('../utils/AppError')

const getAllSlogan = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM slogans WHERE active = true'
  let countQuery = 'SELECT COUNT(*) FROM slogans WHERE active = true'
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
  query += ` ORDER BY index ASC LIMIT $${queryParams.length - 1} OFFSET $${
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

const getAllSloganPrivate = async ({
  page = 1,
  limit = 10,
  search = '',
  active = ''
}) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM slogans'
  let countQuery = 'SELECT COUNT(*) FROM slogans'
  let conditions = []

  // Tìm kiếm theo tên (search)
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(name) LIKE LOWER($${queryParams.length})`)
  }

  if (active) {
    queryParams.push(active) // ✅ Không cần % vì là so sánh bằng
    conditions.push(`active = $${queryParams.length}`) // ✅ active là boolean, không cần LOWER
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

const getSloganById = async id => {
  const result = await db.query(
    'SELECT * FROM slogans WHERE id = $1 AND active = true',
    [id]
  )
  return result.rows[0]
}

const getSloganByIdPrivate = async id => {
  const result = await db.query('SELECT * FROM slogans WHERE id = $1', [id])
  return result.rows[0]
}

const createSlogan = async ({
  name,
  description,
  type,
  index,
  active,
  image
}) => {
  try {
    // Kiểm tra index đã tồn tại chưa
    const existingIndex = await db.query(
      'SELECT id FROM slogans WHERE index = $1',
      [index]
    )

    if (existingIndex.rows.length > 0) {
      throw new AppError(`Số thứ tự ${index} đã tồn tại`, 400)
    }

    const result = await db.query(
      'INSERT INTO slogans(name, description, type, index, active, image) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [String(name).trim(), description, type, index, active, image]
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      // Duplicate name
      throw new AppError('Tiêu đề đã tồn tại', 400)
    }
    if (error instanceof AppError) {
      throw error
    }
    throw error
  }
}

const updateSlogan = async (
  id,
  name,
  description,
  type,
  index,
  active,
  image
) => {
  try {
    // Kiểm tra index đã tồn tại chưa (loại trừ slogan hiện tại)
    const existingIndex = await db.query(
      'SELECT id FROM slogans WHERE index = $1 AND id != $2',
      [index, id]
    )

    if (existingIndex.rows.length > 0) {
      throw new AppError(`Số thứ tự ${index} đã tồn tại`, 400)
    }

    const result = await db.query(
      'UPDATE slogans SET name = $1, description = $2, type = $3, index = $4, active = $5, image = $6 WHERE id = $7 RETURNING *',
      [String(name).trim(), description, type, index, active, image, id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy slogan', 404)
    }

    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    console.error('Lỗi khi cập nhật slogan:', error)
    throw new AppError('Lỗi server khi cập nhật slogan', 500)
  }
}

/**
 * Cập nhật index hàng loạt cho nhiều slogan
 * @param {Array} items - Mảng các object chứa { id, index }
 */
const updateSloganIndexes = async items => {
  try {
    // Validate dữ liệu trước
    for (const item of items) {
      const { id, index } = item

      if (!id || isNaN(parseInt(id))) {
        throw new AppError(`ID không hợp lệ: ${id}`, 400)
      }

      if (index === undefined || index === null || isNaN(parseInt(index))) {
        throw new AppError(`Số thứ tự không hợp lệ cho ID ${id}`, 400)
      }
    }

    // Lấy danh sách ID để kiểm tra tồn tại
    const ids = items.map(item => item.id)
    const checkExist = await db.query(
      'SELECT id FROM slogans WHERE id = ANY($1::int[])',
      [ids]
    )

    if (checkExist.rows.length !== ids.length) {
      const existingIds = checkExist.rows.map(row => row.id)
      const notFoundIds = ids.filter(id => !existingIds.includes(id))
      throw new AppError(
        `Không tìm thấy slogan với ID: ${notFoundIds.join(', ')}`,
        404
      )
    }

    // Kiểm tra index không trùng nhau trong request
    const indexes = items.map(item => item.index)
    const uniqueIndexes = [...new Set(indexes)]
    if (indexes.length !== uniqueIndexes.length) {
      throw new AppError('Các index không được trùng nhau trong request', 400)
    }

    // Kiểm tra index không bị trùng với slogan khác ngoài danh sách đang cập nhật
    const existingIndex = await db.query(
      'SELECT index FROM slogans WHERE index = ANY($1::int[]) AND id != ALL($2::int[])',
      [indexes, ids]
    )

    if (existingIndex.rows.length > 0) {
      const duplicateIndexes = existingIndex.rows.map(row => row.index)
      throw new AppError(
        `Các index ${duplicateIndexes.join(', ')} đã tồn tại ở slogan khác`,
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
      UPDATE slogans 
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
      message: 'Cập nhật số thứ tự thành công',
      data: result.rows
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    console.error('Lỗi khi cập nhật index hàng loạt:', error)
    throw new AppError('Lỗi server khi cập nhật số thứ tự', 500)
  }
}

const deleteSlogan = async id => {
  try {
    // Nếu không có sản phẩm, thực hiện xóa
    const deleteResult = await db.query(
      'DELETE FROM slogans WHERE id = $1 RETURNING *',
      [id]
    )

    if (!deleteResult.rows[0]) {
      throw new AppError('ảnh không tồn tại', 404)
    }

    return {
      success: true,
      message: 'Xóa ảnh thành công',
      data: deleteResult.rows[0]
    }
  } catch (error) {
    throw error
  }
}

module.exports = {
  getAllSlogan,
  getAllSloganPrivate,
  getSloganById,
  getSloganByIdPrivate,
  createSlogan,
  updateSlogan,
  updateSloganIndexes,
  deleteSlogan
}
