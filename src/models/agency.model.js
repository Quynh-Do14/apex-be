const db = require('../config/database')

const getAllAgency = async ({
  page = 1,
  limit = 10,
  search = '',
  province,
  district,
  star_rate,
  category_id
}) => {
  const offset = (page - 1) * limit
  const conditions = []
  const values = []
  let paramIndex = 1

  // Xây dựng điều kiện WHERE
  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(a.name ILIKE $${paramIndex})`)
    paramIndex++
  }

  if (province) {
    values.push(`%${province}%`)
    conditions.push(`a.province ILIKE $${paramIndex}`)
    paramIndex++
  }

  if (district) {
    values.push(`%${district}%`)
    conditions.push(`a.district ILIKE $${paramIndex}`)
    paramIndex++
  }

  if (star_rate) {
    // Nếu star_rate là số, không dùng ILIKE
    values.push(parseFloat(star_rate))
    conditions.push(`a.star_rate = $${paramIndex}`)
    paramIndex++
  }

  // JOIN cho điều kiện category_id
  let joinClause = ''
  if (category_id) {
    values.push(parseInt(category_id))
    conditions.push(`act.category_id = $${paramIndex}`)
    paramIndex++
    joinClause = 'INNER JOIN agency_categories_type act ON a.id = act.agency_id'
  }

  // Tạo câu WHERE
  const whereClause =
    conditions.length > 0
      ? ` WHERE ${conditions.join(' AND ')} AND a.active = true`
      : ''

  // Câu truy vấn chính - DISTINCT để tránh trùng lặp khi JOIN
  const dataQuery = `
    SELECT DISTINCT a.* 
    FROM agency a
    ${joinClause}
    ${whereClause}
    ORDER BY a.star_rate DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `

  // Câu truy vấn đếm tổng số dòng
  const countQuery = `
    SELECT COUNT(DISTINCT a.id) 
    FROM agency a
    ${joinClause}
    ${whereClause}
  `

  // Thêm limit và offset vào values
  values.push(limit, offset)

  // Thực hiện truy vấn chính
  const dataResult = await db.query(dataQuery, values)

  // Lấy categories cho từng agency (sử dụng Promise.all để chạy song song)
  const agenciesWithCategories = await Promise.all(
    dataResult.rows.map(async item => {
      const agencyCategoriesResult = await db.query(
        `SELECT act.*, ac.name as category_name 
         FROM agency_categories_type act 
         LEFT JOIN categories ac ON act.category_id = ac.id 
         WHERE act.agency_id = $1`,
        [item.id]
      )

      return {
        ...item,
        categories: agencyCategoriesResult.rows
      }
    })
  )

  // Thực hiện truy vấn đếm (loại bỏ limit và offset)
  const countParams = values.slice(0, values.length - 2)
  const countResult = await db.query(countQuery, countParams)
  const total = parseInt(countResult.rows[0].count)

  return {
    data: agenciesWithCategories,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getAllAgencyPrivate = async ({
  page = 1,
  limit = 10,
  search = '',
  province,
  district,
  star_rate,
  category_id,
  active
}) => {
  const offset = (page - 1) * limit
  const conditions = []
  const values = []
  let paramIndex = 1

  // Xây dựng điều kiện WHERE
  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(a.name ILIKE $${paramIndex})`)
    paramIndex++
  }

  if (province) {
    values.push(`%${province}%`)
    conditions.push(`a.province ILIKE $${paramIndex}`)
    paramIndex++
  }

  if (district) {
    values.push(`%${district}%`)
    conditions.push(`a.district ILIKE $${paramIndex}`)
    paramIndex++
  }

  if (star_rate) {
    // Nếu star_rate là số, không dùng ILIKE
    values.push(parseFloat(star_rate))
    conditions.push(`a.star_rate = $${paramIndex}`)
    paramIndex++
  }
  if (active !== undefined && active !== '') {
    // Xử lý active là boolean
    const activeBool = active === 'true' || active === true
    values.push(activeBool)
    conditions.push(`a.active = $${paramIndex}`)
    paramIndex++
  }

  // JOIN cho điều kiện category_id
  let joinClause = ''
  if (category_id) {
    values.push(parseInt(category_id))
    conditions.push(`act.category_id = $${paramIndex}`)
    paramIndex++
    joinClause = 'INNER JOIN agency_categories_type act ON a.id = act.agency_id'
  }

  // Tạo câu WHERE
  const whereClause =
    conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

  // Câu truy vấn chính - DISTINCT để tránh trùng lặp khi JOIN
  const dataQuery = `
    SELECT DISTINCT a.* 
    FROM agency a
    ${joinClause}
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `

  // Câu truy vấn đếm tổng số dòng
  const countQuery = `
    SELECT COUNT(DISTINCT a.id) 
    FROM agency a
    ${joinClause}
    ${whereClause}
  `

  // Thêm limit và offset vào values
  values.push(limit, offset)

  // Thực hiện truy vấn chính
  const dataResult = await db.query(dataQuery, values)

  // Lấy categories cho từng agency (sử dụng Promise.all để chạy song song)
  const agenciesWithCategories = await Promise.all(
    dataResult.rows.map(async item => {
      const agencyCategoriesResult = await db.query(
        `SELECT act.*, ac.name as category_name 
         FROM agency_categories_type act 
         LEFT JOIN categories ac ON act.category_id = ac.id 
         WHERE act.agency_id = $1`,
        [item.id]
      )

      return {
        ...item,
        categories: agencyCategoriesResult.rows
      }
    })
  )

  // Thực hiện truy vấn đếm (loại bỏ limit và offset)
  const countParams = values.slice(0, values.length - 2)
  const countResult = await db.query(countQuery, countParams)
  const total = parseInt(countResult.rows[0].count)

  return {
    data: agenciesWithCategories,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getAgencyById = async id => {
  // Lấy thông tin agency
  const result = await db.query(
    'SELECT * FROM agency WHERE id = $1 AND active = true',
    [id]
  )

  // Lấy danh sách categories type của agency
  const agencyCategoriesType = await db.query(
    `SELECT id, category_id, agency_id FROM agency_categories_type WHERE agency_id = $1`,
    [id]
  )

  // Thêm field agency_categories_type vào kết quả
  result.rows[0].agency_categories_type = agencyCategoriesType.rows

  return result.rows[0]
}

const getAgencyByIdPrivate = async id => {
  // Lấy thông tin agency
  const result = await db.query('SELECT * FROM agency WHERE id = $1', [id])

  // Lấy danh sách categories type của agency
  const agencyCategoriesType = await db.query(
    `SELECT id, category_id, agency_id FROM agency_categories_type WHERE agency_id = $1`,
    [id]
  )

  // Thêm field agency_categories_type vào kết quả
  result.rows[0].agency_categories_type = agencyCategoriesType.rows

  return result.rows[0]
}

const createAgency = async ({
  name,
  address,
  lat,
  long,
  phone_number,
  phone_number_2,
  phone_number_3,
  province,
  district,
  star_rate,
  agency_categories_type = [],
  active,
  image
}) => {
  const result = await db.query(
    'INSERT INTO agency(name, address, lat, long, phone_number, phone_number_2, phone_number_3 ,province, district, star_rate, active, image) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
    [
      name,
      address,
      lat,
      long,
      phone_number,
      phone_number_2,
      phone_number_3,
      province,
      district,
      star_rate,
      active,
      image
    ]
  )

  const agencyId = result.rows[0].id

  // 3. Insert thông số kỹ thuật
  for (const type of agency_categories_type) {
    await db.query(
      `INSERT INTO agency_categories_type (agency_id, category_id) VALUES ($1, $2)`,
      [agencyId, type]
    )
  }

  return result.rows[0]
}

const updateAgency = async (
  id,
  {
    name,
    address,
    lat,
    long,
    phone_number,
    phone_number_2,
    phone_number_3,
    province,
    district,
    star_rate,
    agency_categories_type = [],
    active,
    image
  }
) => {
  // Xây dựng câu truy vấn động
  const fields = []
  const values = []
  let query = 'UPDATE agency SET '

  if (name !== undefined) {
    fields.push('name')
    values.push(name)
  }

  if (address !== undefined) {
    fields.push('address')
    values.push(address)
  }

  if (lat !== undefined) {
    fields.push('lat')
    values.push(lat)
  }

  if (long !== undefined) {
    fields.push('long')
    values.push(long)
  }

  if (phone_number !== undefined) {
    fields.push('phone_number')
    values.push(phone_number)
  }
  if (phone_number !== undefined) {
    fields.push('phone_number_2')
    values.push(phone_number_2)
  }
  if (phone_number !== undefined) {
    fields.push('phone_number_3')
    values.push(phone_number_3)
  }

  if (province !== undefined) {
    fields.push('province')
    values.push(province)
  }

  if (district !== undefined) {
    fields.push('district')
    values.push(district)
  }

  if (star_rate !== undefined) {
    fields.push('star_rate')
    values.push(star_rate)
  }

  if (active !== undefined) {
    fields.push('active')
    values.push(active)
  }

  if (image !== undefined) {
    fields.push('image')
    values.push(image)
  }

  // Tạo phần SET của câu query
  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ')

  query += setClause + ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  const result = await db.query(query, values)

  // 3. Insert thông số kỹ thuật
  await db.query(`DELETE FROM agency_categories_type WHERE agency_id = $1`, [
    id
  ])
  for (const type of agency_categories_type) {
    await db.query(
      `INSERT INTO agency_categories_type (agency_id, category_id) VALUES ($1, $2)`,
      [id, type]
    )
  }

  return result.rows[0]
}

const deleteAgency = async id => {
  await db.query('DELETE FROM agency WHERE id = $1', [id])
}

module.exports = {
  getAllAgency,
  getAllAgencyPrivate,
  getAgencyById,
  getAgencyByIdPrivate,
  createAgency,
  updateAgency,
  deleteAgency
}
