const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Format numbers using Indian grouping (e.g., 12,34,567)
const formatIndian = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('en-IN');
};

// 1. Setup Email Transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Setup Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generic function to send BOTH Email and SMS
const sendAlerts = async (email, mobile, subject, message) => {
  try {
    // --- SEND EMAIL ---
    if (process.env.EMAIL_USER) {
      await transporter.sendMail({
        from: `"CarRentals" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
      });
      console.log(`📧 Email sent to ${email}`);
    }

    // --- SEND SMS VIA TWILIO ---
    if (process.env.TWILIO_ACCOUNT_SID && mobile) {
      // Ensure the number has the +91 country code for India
      const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;
      
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedMobile
      });
      console.log(`📱 SMS successfully sent to ${formattedMobile} via Twilio!`);
    }

  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

const sendRegistrationAlert = (user) => {
  const subject = "Welcome to CarRentals!";
  const message = `Hello ${user.name},\n\nWelcome to CarRentals! Your account has been successfully created as a ${user.role}.\n\nYou can now log in using your Username (@${user.username}), Email, or Mobile number.\n\nThank you for joining us!`;
  sendAlerts(user.email, user.mobile, subject, message);
};

const sendBookingAlert = (user, car, booking) => {
  const duration = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));
  const subject = "Booking Confirmed - CarRentals";
  const message = `Hello ${user.name},\n\nYour booking is CONFIRMED!\n\nDetails:\n- Vehicle: ${car.make} ${car.model} (${car.year})\n- Duration: ${duration} Days\n- Total Price: Rs.${formatIndian(booking.totalCost)}\n- Status: ${booking.status}\n\nThank you for choosing us and visit again!`;
  
  sendAlerts(user.email, user.mobile, subject, message);
};

const sendPaymentAlert = (user, car, booking) => {
  const duration = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));
  const subject = "Payment Successful - CarRentals";
  const message = `Hello ${user.name},\n\nPayment SUCCESSFUL for your rental!\n\nDetails:\n- Vehicle: ${car.make} ${car.model} (${car.year})\n- Duration: ${duration} Days\n- Amount Paid: Rs.${formatIndian(booking.totalCost)}\n\nThank you! Please give us feedback and give us ratings to help us improve!`;
  
  sendAlerts(user.email, user.mobile, subject, message);
};

const sendOtpAlert = (email, mobile, otp) => {
  const subject = "Password Reset OTP - CarRentals";
  const message = `Your CarRentals Password Reset OTP is: ${otp}. It is valid for 5 minutes. Do not share this with anyone.`;
  sendAlerts(email, mobile, subject, message);
};

module.exports = { sendRegistrationAlert, sendBookingAlert, sendPaymentAlert, sendOtpAlert };