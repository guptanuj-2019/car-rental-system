const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendNotifications = async ({ email, phone, otp, message }) => {
  // Send Email
  if (email) {
    try {
      await transporter.sendMail({
        from: "Car Rental System" <>,
        to: email,
        subject: 'Password Reset OTP - Car Rental System',
        text: message || Your OTP for password reset is: ,
        html: <p>Your OTP for password reset is: <b></b></p>,
      });
      console.log(Email sent successfully to );
    } catch (emailErr) {
      console.error('Email sending error:', emailErr.message);
    }
  }

  // Send SMS (Optional / Non-blocking)
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER && phone) {
    try {
      await twilioClient.messages.create({
        body: message || Your OTP for password reset is: ,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      console.log(SMS sent successfully to );
    } catch (smsErr) {
      console.warn('SMS skipped or failed (non-critical):', smsErr.message);
    }
  }
};

module.exports = sendNotifications;
