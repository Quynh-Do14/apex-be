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

  async sendContactFormEmail (contactData, adminEmail) {
    const { name, email, phone, subject, message } = contactData

    const mailOptions = {
      from: `"Hệ thống liên hệ" <${process.env.EMAIL_FROM}>`,
      to: adminEmail || process.env.ADMIN_EMAIL, // Có thể cấu hình trong .env
      replyTo: email, // Cho phép admin trả lời trực tiếp vào email của người dùng
      subject: `[Liên hệ] ${subject || 'Tin nhắn từ khách hàng'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">📩 Thông tin liên hệ mới</h2>
          
          <div style="margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; background-color: #f8f9fa; font-weight: bold; width: 120px;">Họ tên:</td>
                <td style="padding: 8px 12px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background-color: #f8f9fa; font-weight: bold;">Email:</td>
                <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              ${
                phone
                  ? `
              <tr>
                <td style="padding: 8px 12px; background-color: #f8f9fa; font-weight: bold;">Số điện thoại:</td>
                <td style="padding: 8px 12px;"><a href="tel:${phone}">${phone}</a></td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding: 8px 12px; background-color: #f8f9fa; font-weight: bold;">Tiêu đề:</td>
                <td style="padding: 8px 12px;">${
                  subject || 'Không có tiêu đề'
                }</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff;">
            <h4 style="margin-top: 0; color: #333;">📝 Nội dung tin nhắn:</h4>
            <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString(
              'vi-VN',
              { timeZone: 'Asia/Ho_Chi_Minh' }
            )}</p>
            <p><strong>IP:</strong> {{ipAddress}}</p>
            <p style="font-style: italic;">💡 Bạn có thể trả lời trực tiếp email này để liên hệ với khách hàng.</p>
          </div>
          
          <hr>
          <p style="color: #666; font-size: 12px; text-align: center;">Email này được gửi tự động từ hệ thống liên hệ. Vui lòng không trả lời nếu bạn không phải là quản trị viên.</p>
        </div>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Contact form email sent to admin:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send contact form email:', error)
      throw new Error('Không thể gửi email liên hệ đến quản trị viên')
    }
  }

  /**
   * Gửi email xác nhận cho người dùng khi họ gửi form liên hệ thành công
   */
  async sendContactConfirmationEmail (contactData) {
    const { name, email, phone_number, message } = contactData

    const mailOptions = {
      from: `"Hệ thống" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Xác nhận đã nhận được tin nhắn của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xin chào ${name},</h2>
          <p>Cảm ơn bạn đã liên hệ với chúng tôi!</p>
          <p>Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <h4 style="margin-top: 0; color: #333;">📝 Nội dung bạn đã gửi:</h4>
            <p style="white-space: pre-wrap; line-height: 1.6;"><strong>Nội dung:</strong> ${message}</p>
          </div>

          <p style="color: #666; font-size: 14px;">Chúng tôi sẽ liên hệ lại với bạn qua email hoặc số điện thoại trong vòng 24-48 giờ.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Contact confirmation email sent to user:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send contact confirmation email:', error)
      // Không throw error vì đây không phải chức năng chính
    }
  }

  async sendContactConfirmationEmailToAdmin (contactData) {
    const { name, email, phone_number, message } = contactData

    const mailOptions = {
      from: `"Hệ thống" <${process.env.EMAIL_FROM}>`,
      to: 'nghiatn209@gmail.com',
      subject: 'Xác nhận đã nhận được tin nhắn của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">🔔 Thông báo liên hệ mới</h2>
          <p>Xin chào Admin,</p>
          <p>Có một khách hàng mới vừa gửi tin nhắn liên hệ qua website. Dưới đây là thông tin chi tiết:</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <h4 style="margin-top: 0; color: #333;">📋 Thông tin khách hàng:</h4>
            <p><strong>👤 Họ tên:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${email || 'Không có email'}</p>
            <p><strong>📧 SĐT:</strong> ${phone_number || 'Không có SĐT'}</p>
            <p><strong>📱 Số điện thoại:</strong> ${
              phone || 'Không có số điện thoại'
            }</p>
            <p style="white-space: pre-wrap; line-height: 1.6;"><strong>💬 Nội dung:</strong> ${message}</p>
          </div>

          <p style="color: #666; font-size: 14px;">Vui lòng kiểm tra và phản hồi lại khách hàng trong thời gian sớm nhất.</p>
          <p style="color: #666; font-size: 14px;">Thời gian nhận: ${new Date().toLocaleString(
            'vi-VN'
          )}</p>
          
          <hr>
          <p style="color: #999; font-size: 12px;">Email này được gửi tự động từ hệ thống website. Vui lòng không trả lời email này.</p>
        </div>
      `
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Contact confirmation email sent to user:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send contact confirmation email:', error)
      // Không throw error vì đây không phải chức năng chính
    }
  }
}

module.exports = new EmailService()
