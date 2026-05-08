const db = require('../config/database')

const getAllConfigPage = async ({
  page = 1,
  limit = 10,
  search = '',
  type = ''
}) => {
  const offset = (page - 1) * limit
  const values = []
  const conditions = []

  let whereClause = ''

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`LOWER(title) LIKE LOWER($${values.length})`)
  }

  if (type) {
    values.push(type) // Không cần % ở đây nếu là exact match
    conditions.push(`type = $${values.length}`)
  }

  if (conditions.length > 0) {
    whereClause = ` WHERE ${conditions.join(' AND ')}` // Sửa FROM thành WHERE
  }

  // Lưu độ dài hiện tại trước khi thêm limit, offset
  const paramsLength = values.length

  // Thêm limit và offset vào values
  values.push(limit)
  values.push(offset)

  const dataQuery = `
    SELECT * FROM config_page
    ${whereClause}
    ORDER BY index ASC
    LIMIT $${paramsLength + 1}
    OFFSET $${paramsLength + 2}
    `

  const countQuery = `
    SELECT COUNT(*) FROM config_page
    ${whereClause}
  `

  // Lấy tổng số (chỉ dùng params trước khi thêm limit, offset)
  const countResult = await db.query(countQuery, values.slice(0, paramsLength))
  const total = parseInt(countResult.rows[0].count)

  // Lấy dữ liệu (dùng tất cả params)
  const dataResult = await db.query(dataQuery, values)

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

const getConfigPageById = async id => {
  const result = await db.query('SELECT * FROM config_page WHERE id = $1', [id])
  return result.rows[0]
}

const createConfigPage = async ({
  title,
  description,
  box_content,
  type,
  index
}) => {
  // Danh sách type hợp lệ
  const validTypes = [
    'TITLE_PAGE',
    'SECTION_1',
    'SECTION_2',
    'SECTION_3',
    'SECTION_4',
    'SECTION_5'
  ]

  // Validate type
  if (!type || type.trim() === '') {
    throw new Error('Loại nội dung không được để trống.')
  }

  // Kiểm tra type có hợp lệ không
  if (!validTypes.includes(type)) {
    throw new Error(
      `Loại nội dung "${type}" không hợp lệ. Loại hợp lệ: ${validTypes.join(
        ', '
      )}`
    )
  }

  if (type == 'SECTION_1') {
    const existingIndex = await db.query(
      'SELECT id FROM config_page WHERE index = $1',
      [index]
    )

    if (existingIndex.rows.length > 0) {
      throw new Error(`Số thứ tự ${index} đã tồn tại`, 400)
    }
  }
  if (type !== 'SECTION_1') {
    const existingConfigPage = await db.query(
      'SELECT * FROM config_page WHERE type = $1',
      [type]
    )

    if (existingConfigPage.rows.length > 0) {
      // Lấy tên tiếng Việt của type để hiển thị thông báo thân thiện hơn
      const typeLabels = {
        TITLE_PAGE: 'Tiêu đề Website',
        SECTION_1: 'Khung 1',
        SECTION_2: 'Khung 2',
        SECTION_3: 'Khung 3',
        SECTION_4: 'Khung 4',
        SECTION_5: 'Khung 5'
      }
      const typeLabel = typeLabels[type] || type
      throw new Error(
        `Nội dung cho "${typeLabel}" đã tồn tại. Khung này không thể có nhiều nội dung.`
      )
    }
  }

  // Validate các trường khác
  if (!title || title.trim() === '') {
    throw new Error('Tiêu đề không được để trống.')
  }

  const result = await db.query(
    'INSERT INTO config_page(title, description, box_content, type, index) VALUES($1, $2, $3, $4, $5) RETURNING *',
    [title, description, box_content, type, index]
  )
  return result.rows[0]
}

const updateConfigPage = async (
  id,
  { title, description, box_content, type, index }
) => {
  // Danh sách type hợp lệ
  const validTypes = [
    'TITLE_PAGE',
    'SECTION_1',
    'SECTION_2',
    'SECTION_3',
    'SECTION_4',
    'SECTION_5'
  ]

  // Kiểm tra ID hợp lệ
  if (!id) {
    throw new Error('ID nội dung không hợp lệ.')
  }

  // Kiểm tra ConfigPage hiện tại
  const currentConfigPage = await db.query(
    'SELECT type FROM config_page WHERE id = $1',
    [id]
  )

  if (currentConfigPage.rows.length === 0) {
    throw new Error('Không tìm thấy nội dung này.')
  }

  const currentType = currentConfigPage.rows[0].type

  // Nếu có truyền type mới
  if (type !== undefined) {
    // Validate type
    if (!type || type.trim() === '') {
      throw new Error('Loại nội dung không được để trống.')
    }

    // Kiểm tra type có hợp lệ không
    if (!validTypes.includes(type)) {
      throw new Error(
        `Loại ConfigPage "${type}" không hợp lệ. Loại hợp lệ: ${validTypes.join(
          ', '
        )}`
      )
    }

    if (type == 'SECTION_1') {
      const existingIndex = await db.query(
        'SELECT id FROM config_page WHERE index = $1  AND id != $2',
        [index, id]
      )

      if (existingIndex.rows.length > 0) {
        throw new Error(`Số thứ tự ${index} đã tồn tại`, 400)
      }
    }

    if (type !== 'SECTION_1') {
      const existingConfigPage = await db.query(
        'SELECT * FROM config_page WHERE type = $1 AND id != $2',
        [type, id]
      )

      if (existingConfigPage.rows.length > 0) {
        // Lấy tên tiếng Việt của type để hiển thị thông báo thân thiện hơn
        const typeLabels = {
          TITLE_PAGE: 'Tiêu đề Website',
          SECTION_1: 'Khung 1',
          SECTION_2: 'Khung 2',
          SECTION_3: 'Khung 3',
          SECTION_4: 'Khung 4',
          SECTION_5: 'Khung 5'
        }
        const typeLabel = typeLabels[type] || type
        throw new Error(
          `Nội dung cho "${typeLabel}" đã tồn tại. Khung này không thể có nhiều nội dung.`
        )
      }
    }

    // Nếu đang đổi TỪ type không phải HOMEPAGE SANG HOMEPAGE
    if (currentType !== 'SECTION_1' && type === 'SECTION_1') {
      // Cho phép chuyển sang HOMEPAGE vì HOMEPAGE có thể có nhiều ConfigPage
    }

    // Nếu đang đổi TỪ HOMEPAGE SANG type không phải HOMEPAGE
    if (currentType === 'SECTION_1' && type !== 'SECTION_1') {
      // Kiểm tra xem type mới đã tồn tại chưa
      const existingConfigPage = await db.query(
        'SELECT * FROM config_page WHERE type = $1',
        [type]
      )

      if (existingConfigPage.rows.length > 0) {
        const typeLabels = {
          TITLE_PAGE: 'Tiêu đề Website',
          SECTION_1: 'Khung 1',
          SECTION_2: 'Khung 2',
          SECTION_3: 'Khung 3',
          SECTION_4: 'Khung 4',
          SECTION_5: 'Khung 5'
        }
        const typeLabel = typeLabels[type] || type
        throw new Error(
          `Nội dung cho "${typeLabel}" đã tồn tại. Khung này không thể có nhiều nội dung.`
        )
      }
    }
  }

  // Thực hiện update
  const fields = []
  const values = []
  let query = 'UPDATE config_page SET '

  if (title !== undefined) {
    if (title !== null && title !== '' && title.trim() === '') {
      throw new Error('Tiêu đề không được để trống.')
    }
    fields.push('title')
    values.push(title !== null ? title.trim() : null)
  }
  if (description !== undefined) {
    fields.push('description')
    values.push(description)
  }
  if (box_content !== undefined) {
    fields.push('box_content')
    values.push(box_content)
  }
  if (type !== undefined) {
    fields.push('type')
    values.push(type)
  }

  if (index !== undefined) {
    fields.push('index')
    values.push(index)
  }

  if (fields.length === 0) {
    throw new Error('Không có trường nào để cập nhật.')
  }

  // Tạo câu query động
  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ')

  query += setClause + ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  try {
    const result = await db.query(query, values)
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      // PostgreSQL unique violation
      throw new Error(
        `Nội dung cho khung này đã tồn tại. Khung này không thể có nhiều nội dung.`
      )
    }
    throw new Error(`Cập nhật nội dung thất bại: ${error.message}`)
  }
}

const updateConfigPageIndex = async items => {
  try {
    // Validate dữ liệu trước
    for (const item of items) {
      const { id, index } = item

      if (!id || isNaN(parseInt(id))) {
        throw new Error(`ID không hợp lệ: ${id}`, 400)
      }

      if (index === undefined || index === null || isNaN(parseInt(index))) {
        throw new Error(`Số thứ tự không hợp lệ cho ID ${id}`, 400) // ✅ Sửa message
      }
    }

    // Lấy danh sách ID để kiểm tra tồn tại
    const ids = items.map(item => item.id)
    const checkExist = await db.query(
      'SELECT id FROM config_page WHERE id = ANY($1::int[])',
      [ids]
    )

    if (checkExist.rows.length !== ids.length) {
      const existingIds = checkExist.rows.map(row => row.id)
      const notFoundIds = ids.filter(id => !existingIds.includes(id))
      throw new Error(
        `Không tìm thấy danh mục với ID: ${notFoundIds.join(', ')}`, // ✅ Sửa từ "sản phẩm" thành "danh mục"
        404
      )
    }

    // Kiểm tra index không trùng nhau trong request
    const indexes = items.map(item => item.index)
    const uniqueIndexes = [...new Set(indexes)]
    if (indexes.length !== uniqueIndexes.length) {
      throw new Error(
        'Các số thứ tự không được trùng nhau trong request', // ✅ Sửa message
        400
      )
    }

    // Kiểm tra index không bị trùng với danh mục khác ngoài danh sách đang cập nhật
    const existingOrder = await db.query(
      'SELECT index FROM config_page WHERE index = ANY($1::int[]) AND id != ALL($2::int[])',
      [indexes, ids]
    )

    if (existingOrder.rows.length > 0) {
      const duplicateOrders = existingOrder.rows.map(row => row.index)
      throw new Error(
        `Các số thứ tự ${duplicateOrders.join(
          ', '
        )} đã tồn tại ở nội dung khác`, // ✅ Sửa message
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
      UPDATE config_page 
      SET index = CASE 
        ${caseWhen}
        ELSE index 
      END
      WHERE id IN (${items.map((_, i) => `$${i * 2 + 1}`).join(', ')})
      RETURNING id, index, title, description, type
    `

    const result = await db.query(query, params)

    return {
      success: true,
      message: 'Cập nhật số thứ tự thành công', // ✅ Sửa message
      data: result.rows
    }
  } catch (error) {
    if (error instanceof Error) throw error
    console.error('Lỗi khi cập nhật số thứ tự hàng loạt:', error) // ✅ Sửa log
    throw new Error('Lỗi server khi cập nhật số thứ tự', 500) // ✅ Sửa message
  }
}

const deleteConfigPage = async id => {
  await db.query('DELETE FROM config_page WHERE id = $1', [id])
}

module.exports = {
  getAllConfigPage,
  getConfigPageById,
  createConfigPage,
  updateConfigPage,
  updateConfigPageIndex,
  deleteConfigPage
}
