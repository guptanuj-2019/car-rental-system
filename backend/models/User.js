const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  mobile: { type: String, required: [true, 'Mobile number is required'], unique: true, match: [/^\d{10}$/, 'Please use a valid 10-digit mobile number'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] },
  password: { type: String, required: true },
  role: { type: String, enum: ['Customer', 'Rental Staff', 'Admin'], default: 'Customer' },
  
  // --- NEW: PASSWORD EXPIRATION & OTP FIELDS ---
  lastPasswordChange: { type: Date, default: Date.now },
  resetOtp: { type: String },
  resetOtpExpire: { type: Date }
}, { timestamps: true });// Hash password before saving

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);