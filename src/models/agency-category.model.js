const db = require('../config/database')
const AppError = require('../utils/AppError')

const getAllCategories = async ({ page = 1, limit = 10, search = '' }) => {
  try {
    const offset = (page - 1) * limit
    const queryParams = []
    let query = 'SELECT * FROM agency_categories'
    let countQuery = 'SELECT COUNT(*) FROM agency_categories'
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
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục đại lý:', error)
    throw new AppError('Lỗi server khi lấy danh sách danh mục đại lý', 500)
  }
}

const getCategoryById = async id => {
  try {
    const result = await db.query(
      'SELECT * FROM agency_categories WHERE id = $1',
      [id]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục đại lý:', error)
    throw new AppError('Lỗi server khi lấy thông tin danh mục đại lý', 500)
  }
}

const getCategoryByName = async name => {
  try {
    const result = await db.query(
      'SELECT * FROM agency_categories WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Lỗi khi kiểm tra tên danh mục đại lý:', error)
    throw error
  }
}

const createCategory = async ({ name }) => {
  try {
    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await getCategoryByName(name)
    if (existingCategory) {
      throw new AppError('Tên danh mục đại lý đã tồn tại', 400)
    }

    const result = await db.query(
      'INSERT INTO agency_categories(name) VALUES($1) RETURNING *',
      [name.trim()]
    )
    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error.code === '23505') {
      // Unique constraint violation
      throw new AppError('Tên danh mục đại lý đã tồn tại', 400)
    }

    console.error('Lỗi khi tạo danh mục đại lý:', error)
    throw new AppError('Lỗi server khi tạo danh mục đại lý', 500)
  }
}

const updateCategory = async (id, { name }) => {
  try {
    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await getCategoryById(id)
    if (!categoryExists) {
      throw new AppError('Danh mục đại lý không tồn tại', 404)
    }

    // Kiểm tra tên mới có trùng với danh mục khác không
    if (name && name.trim()) {
      const existingCategory = await db.query(
        'SELECT * FROM agency_categories WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name.trim(), id]
      )
      if (existingCategory.rows.length > 0) {
        throw new AppError('Tên danh mục đại lý đã tồn tại', 400)
      }
    }

    const result = await db.query(
      'UPDATE agency_categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name.trim(), id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy danh mục đại lý', 404)
    }

    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error.code === '23505') {
      // Unique constraint violation
      throw new AppError('Tên danh mục đại lý đã tồn tại', 400)
    }

    console.error('Lỗi khi cập nhật danh mục đại lý:', error)
    throw new AppError('Lỗi server khi cập nhật danh mục đại lý', 500)
  }
}

const deleteCategory = async id => {
  try {
    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await getCategoryById(id)
    if (!categoryExists) {
      throw new AppError('Danh mục đại lý không tồn tại', 404)
    }

    // Kiểm tra xem danh mục có đại lý nào không (qua bảng agency_categories_type)
    const checkQuery = `
      SELECT COUNT(*) as agency_count 
      FROM agency_categories_type
      WHERE category_id = $1
    `
    const checkResult = await db.query(checkQuery, [id])
    const agencyCount = parseInt(checkResult.rows[0].agency_count)

    if (agencyCount > 0) {
      // Lấy thông tin chi tiết về các đại lý liên quan
      const agencyDetailQuery = `
        SELECT a.id, a.name 
        FROM agency a
        INNER JOIN agency_categories_type act ON a.id = act.agency_id
        WHERE act.category_id = $1 
        ORDER BY a.created_at DESC 
        LIMIT 3
      `
      const agencyDetailResult = await db.query(agencyDetailQuery, [id])
      const agencyDetails = agencyDetailResult.rows.map(
        agency => `"${agency.name}"`
      )

      // Lấy tổng số đại lý để hiển thị
      const totalAgencyQuery = `
        SELECT COUNT(DISTINCT a.id) as total_count
        FROM agency a
        INNER JOIN agency_categories_type act ON a.id = act.agency_id
        WHERE act.category_id = $1
      `
      const totalAgencyResult = await db.query(totalAgencyQuery, [id])
      const totalAgencyCount = parseInt(totalAgencyResult.rows[0].total_count)

      throw new AppError(
        `Không thể xóa danh mục "${categoryExists.name}". ` +
          `Có ${totalAgencyCount} đại lý đang thuộc danh mục này. ` +
          `Hãy chuyển hoặc xóa quan hệ của các đại lý trước khi xóa danh mục. `,
        400
      )
    }

    // Thực hiện xóa
    const result = await db.query(
      'DELETE FROM agency_categories WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy danh mục đại lý', 404)
    }

    return {
      success: true,
      message: 'Xóa danh mục đại lý thành công',
      data: result.rows[0]
    }
  } catch (error) {
    // Nếu đã là AppError thì throw tiếp
    if (error instanceof AppError) {
      throw error
    }

    // PostgreSQL foreign key constraint violation
    if (error.code === '23503') {
      // Kiểm tra lại qua bảng trung gian
      const agencyCheck = await db.query(
        'SELECT COUNT(*) FROM agency_categories_type WHERE category_id = $1',
        [id]
      )
      const agencyCount = parseInt(agencyCheck.rows[0].count)

      throw new AppError(
        `Không thể xóa danh mục "${categoryExists?.name || 'này'}". ` +
          `Có ${agencyCount} đại lý đang sử dụng danh mục này. ` +
          `Vui lòng xóa quan hệ giữa đại lý và danh mục trước.`,
        400
      )
    }

    console.error('Lỗi khi xóa danh mục đại lý:', error)
    throw new AppError('Lỗi server khi xóa danh mục đại lý', 500)
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory
}
