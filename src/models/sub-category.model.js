const db = require('../config/database')
const AppError = require('../utils/AppError')

const getAllCategories = async ({ page = 1, limit = 10, search = '' }) => {
  try {
    const offset = (page - 1) * limit
    const queryParams = []
    let query = 'SELECT * FROM sub_category '
    let countQuery = 'SELECT COUNT(*) FROM sub_category '
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
    query += ` ORDER BY id ASC LIMIT $${queryParams.length - 1} OFFSET $${
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
    console.error('Lỗi khi lấy danh sách danh mục:', error)
    throw new AppError('Lỗi server khi lấy danh sách danh mục', 500)
  }
}

const getCategoryById = async id => {
  try {
    const result = await db.query(
      'SELECT * FROM sub_category  WHERE id = $1',
      [id]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error)
    throw new AppError('Lỗi server khi lấy thông tin danh mục', 500)
  }
}

const getCategoryByIdPrivate = async id => {
  try {
    const result = await db.query(
      'SELECT * FROM sub_category  WHERE id = $1',
      [id]
    )
    const category = result.rows[0]
    const blog = await db.query(
      'SELECT * FROM blog WHERE blog_category_id = $1',
      [id]
    )
    category.blog = blog.rows
    return category
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error)
    throw new AppError('Lỗi server khi lấy thông tin danh mục', 500)
  }
}

const getCategoryByName = async name => {
  try {
    const result = await db.query(
      'SELECT * FROM sub_category  WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Lỗi khi kiểm tra tên danh mục:', error)
    throw error
  }
}

const createCategory = async name => {
  try {
    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await getCategoryByName(name)
    if (existingCategory) {
      throw new AppError('Tên danh mục đã tồn tại', 400)
    }

    const result = await db.query(
      'INSERT INTO sub_category (name) VALUES($1) RETURNING *',
      [name.trim()]
    )
    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error.code === '23505') {
      // Unique constraint violation
      throw new AppError('Tên danh mục đã tồn tại', 400)
    }

    console.error('Lỗi khi tạo danh mục:', error)
    throw new AppError('Lỗi server khi tạo danh mục', 500)
  }
}

const updateCategory = async (id, name) => {
  try {
    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await getCategoryById(id)
    if (!categoryExists) {
      throw new AppError('Danh mục blog không tồn tại', 404)
    }

    // Kiểm tra tên mới có trùng với danh mục khác không
    if (name && name.trim()) {
      const existingCategory = await db.query(
        'SELECT * FROM sub_category  WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name.trim(), id]
      )
      if (existingCategory.rows.length > 0) {
        throw new AppError('Tên danh mục đã tồn tại', 400)
      }
    }

    const result = await db.query(
      'UPDATE sub_category  SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name.trim(), id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy danh mục', 404)
    }

    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error.code === '23505') {
      // Unique constraint violation
      throw new AppError('Tên danh mục đã tồn tại', 400)
    }

    console.error('Lỗi khi cập nhật danh mục:', error)
    throw new AppError('Lỗi server khi cập nhật danh mục', 500)
  }
}

const deleteCategory = async id => {
  try {
    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await getCategoryById(id)
    if (!categoryExists) {
      throw new AppError('Danh mục blog không tồn tại', 404)
    }

    // Kiểm tra xem danh mục có blog nào không
    const checkQuery = `
      SELECT COUNT(*) as blog_count 
      FROM blog 
      WHERE blog_category_id = $1
    `
    const checkResult = await db.query(checkQuery, [id])
    const blogCount = parseInt(checkResult.rows[0].blog_count)

    if (blogCount > 0) {
      throw new AppError(
        `Không thể xóa danh mục bài viết. Có ${blogCount} bài viết đang thuộc danh mục này.`,
        400
      )
    }

    // Thực hiện xóa
    const result = await db.query(
      'DELETE FROM sub_category  WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy danh mục', 404)
    }

    return {
      success: true,
      message: 'Xóa danh mục bài viết thành công',
      data: result.rows[0]
    }
  } catch (error) {
    console.log('error', error)

    // Nếu đã là AppError thì throw tiếp
    if (error instanceof AppError) {
      throw error
    }

    // PostgreSQL foreign key constraint violation
    if (error.code === '23503') {
      throw new AppError(
        'Không thể xóa danh mục bài viết vì có bài viết đang sử dụng',
        400
      )
    }

    console.error('Lỗi khi xóa danh mục bài viết:', error)
    throw new AppError('Lỗi server khi xóa danh mục bài viết', 500)
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryByIdPrivate,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory
}
