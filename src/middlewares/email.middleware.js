const nodemailer = require('nodemailer')

class EmailService {
  constructor () {
    // Tạo transporter dựa trên cấu hình email
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true', // true cho 465, false cho các port khác
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  /**
   * Gửi email reset mật khẩu
   */
  async sendPasswordResetEmail (toEmail, resetUrl, userName) {
    const mailOptions = {
      from: `"Hệ thống" <${process.env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'Đặt lại mật khẩu của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xin chào ${userName || 'bạn'},</h2>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
          <p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 10px 20px; 
                      background-color: #007bff; color: white; 
                      text-decoration: none; border-radius: 5px;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p>Hoặc copy và paste link này vào trình duyệt:</p>
          <p>${resetUrl}</p>
          <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 15 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email reset password sent:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Không thể gửi email reset mật khẩu')
    }
  }

  /**
   * Gửi email xác nhận đã đổi mật khẩu
   */
  async sendPasswordChangedEmail (toEmail, userName) {
    const mailOptions = {
      from: `"Hệ thống" <${process.env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'Mật khẩu của bạn đã được thay đổi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xin chào ${userName || 'bạn'},</h2>
          <p>Mật khẩu tài khoản của bạn vừa được thay đổi thành công.</p>
          <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ quản trị viên ngay lập tức.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email password changed sent:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send password changed email:', error)
      // Không throw error vì đây không phải chức năng chính
    }
  }
}

module.exports = new EmailService()
