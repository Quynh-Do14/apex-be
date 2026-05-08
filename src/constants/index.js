const ROLES = {
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  WRITTER: 'WRITTER',
  USER: 'USER'
}

const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted'
}

const MESSAGES = {
  UNAUTHORIZED: 'Không có quyền truy cập',
  FORBIDDEN: 'Không được phép thực hiện hành động này',
  NOT_FOUND: 'Không tìm thấy tài nguyên',
  SERVER_ERROR: 'Lỗi máy chủ',
  LOGIN_FAILED: 'Sai email hoặc mật khẩu',
  REGISTER_SUCCESS: 'Đăng ký thành công'
}

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
}

module.exports = {
  ROLES,
  STATUS,
  MESSAGES,
  PAGINATION
}
