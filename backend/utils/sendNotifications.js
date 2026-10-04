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
  const notificationText = message || Your OTP for password reset is: ;

  // 1. Send Email Notification
  if (email) {
    try {
      await transporter.sendMail({
        from: "Car Rental System" <>,
        to: email,
        subject: 'Password Reset OTP - Car Rental System',
        text: notificationText,
        html: <p>Your OTP for password reset is: <b></b></p>,
      });
      console.log(Email sent successfully to );
    } catch (emailErr) {
      console.error('Email sending error:', emailErr.message);
    }
  }

  // 2. Send Mobile SMS Notification via Twilio
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER && phone) {
    try {
      // Format phone number to E.164 if missing country code
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = +91; // Defaulting to India (+91) if no country code provided
      }

      await twilioClient.messages.create({
        body: notificationText,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });
      console.log(SMS sent successfully to );
    } catch (smsErr) {
      console.warn('Twilio SMS delivery warning:', smsErr.message);
    }
  }
};

module.exports = sendNotifications;
