const nodemailer = require('nodemailer');
const twilio = require('twilio');

const sendNotifications = async ({ email, phone, otp, message }) => {
  if (email) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const error = new Error('Email OTP delivery is not configured. Set EMAIL_USER and EMAIL_PASS on the backend.');
      error.code = 'NOTIFICATION_CONFIG';
      throw error;
    }

    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const notificationText = message || `Your Car Rental System password reset OTP is: ${otp}`;
    await transporter.sendMail({
      from: `"Car Rental System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Car Rental System',
      text: notificationText,
      html: `<p>Your Car Rental System password reset OTP is: <b>${otp}</b></p>`,
    });
    return 'email';
  }

  if (phone) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      const error = new Error('SMS OTP delivery is not configured. Set the Twilio credentials on the backend.');
      error.code = 'NOTIFICATION_CONFIG';
      throw error;
    }

    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim()}`;
    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      const error = new Error('The registered mobile number is not in a valid international format.');
      error.code = 'INVALID_PHONE';
      throw error;
    }

    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: message || `Your Car Rental System password reset OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    return 'mobile';
  }

  throw new Error('No OTP delivery destination was provided.');
};

module.exports = sendNotifications;
