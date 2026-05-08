const db = require('../config/database')

const changePasswordModel = async (id, { password }) => {
  // Dynamic query để chỉ update các field được cung cấp
  const updates = []
  const values = []
  let paramCount = 1

  if (password !== undefined) {
    updates.push(`password = $${paramCount}`)
    values.push(password)
    paramCount++
  }

  // Luôn cập nhật updated_at
  updates.push(`updated_at = NOW()`)

  if (updates.length === 1) {
    // Chỉ có updated_at, không có field nào để update
    throw new Error('No fields to update')
  }

  values.push(id) // id là parameter cuối cùng

  const query = `
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, name, email, created_at, updated_at` // Không nên return password

  try {
    const result = await db.query(query, values)
    return result.rows[0]
  } catch (error) {
    console.error('Database error in changePasswordModel:', error)
    throw new Error('Failed to update password')
  }
}

// ========== FORGOT PASSWORD FUNCTIONS ==========

/**
 * Lưu reset token cho user
 * @param {number} userId - ID của user
 * @param {string} hashedToken - Reset token đã được hash
 * @param {Date} expiresAt - Thời gian hết hạn
 * @returns {Promise<boolean>} - True nếu thành công
 */
const saveResetToken = async (userId, hashedToken, expiresAt) => {
  try {
    const query = `
      UPDATE users 
      SET reset_token = $1, 
          reset_token_expires = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id
    `

    const result = await db.query(query, [hashedToken, expiresAt, userId])

    return result.rows.length > 0
  } catch (error) {
    console.error('Error in saveResetToken:', error)
    throw error
  }
}

/**
 * Tìm user bằng reset token (chỉ lấy token còn hạn)
 * @param {string} resetToken - Reset token đã được hash
 * @returns {Promise<Object|null>} - User object hoặc null
 */
const findUserByResetToken = async resetToken => {
  try {
    const query = `
      SELECT id, name, email, password, reset_token_expires
      FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
      AND active = true
    `
    const result = await db.query(query, [resetToken])

    return result.rows[0] || null
  } catch (error) {
    console.error('Error in findUserByResetToken:', error)
    throw error
  }
}

/**
 * Kiểm tra reset token còn hiệu lực không
 * @param {string} resetToken - Reset token đã được hash
 * @returns {Promise<Object|null>} - User ID và email
 */
const verifyResetToken = async resetToken => {
  try {
    const query = `
      SELECT id, email, name
      FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
      AND active = true
    `
    const result = await db.query(query, [resetToken])

    return result.rows[0] || null
  } catch (error) {
    console.error('Error in verifyResetToken:', error)
    throw error
  }
}

/**
 * Cập nhật mật khẩu mới và xóa reset token
 * @param {number} userId - ID của user
 * @param {string} hashedPassword - Mật khẩu đã được hash
 * @returns {Promise<Object|null>} - User đã cập nhật
 */
const resetPassword = async (userId, hashedPassword) => {
  try {
    const query = `
      UPDATE users 
      SET password = $1,
          reset_token = NULL,
          reset_token_expires = NULL,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email
    `

    const result = await db.query(query, [hashedPassword, userId])
    return result.rows[0] || null
  } catch (error) {
    console.error('Error in resetPassword:', error)
    throw error
  }
}

/**
 * Xóa reset token của user (khi token hết hạn hoặc không dùng nữa)
 * @param {number} userId - ID của user
 * @returns {Promise<boolean>} - True nếu thành công
 */
const clearResetToken = async userId => {
  try {
    const query = `
      UPDATE users 
      SET reset_token = NULL, 
          reset_token_expires = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `

    const result = await db.query(query, [userId])
    return result.rows.length > 0
  } catch (error) {
    console.error('Error in clearResetToken:', error)
    throw error
  }
}

/**
 * Dọn dẹp các token đã hết hạn (có thể chạy định kỳ)
 * @returns {Promise<number>} - Số lượng token đã xóa
 */
const cleanupExpiredTokens = async () => {
  try {
    const query = `
      UPDATE users 
      SET reset_token = NULL, 
          reset_token_expires = NULL
      WHERE reset_token_expires < NOW()
      AND reset_token IS NOT NULL
      RETURNING id
    `

    const result = await db.query(query)
    return result.rowCount
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error)
    throw error
  }
}

module.exports = {
  changePasswordModel,
  saveResetToken,
  findUserByResetToken,
  verifyResetToken,
  resetPassword,
  clearResetToken,
  cleanupExpiredTokens
}
