    // Send Email
    try {
      await transporter.sendMail(mailOptions);
      console.log(Email sent to ${email});
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    // Send SMS (Optional/Safe Fail)
    if (process.env.TWILIO_PHONE_NUMBER && phone) {
      try {
        await twilioClient.messages.create({
          body: Your OTP is: ${otp},
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
      } catch (smsErr) {
        console.warn('SMS skipped or failed (non-critical):', smsErr.message);
      }
    }
