const jwt = require('jsonwebtoken');
const { randomInt } = require('crypto');
const User = require('../models/User');
const sendNotifications = require('../utils/sendNotifications');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const findUserByIdentifier = (value) => {
  const identifier = typeof value === 'string' ? value.trim() : '';
  const lookup = [{ email: identifier }, { username: identifier }];
  if (/^[+\d\s()-]+$/.test(identifier)) {
    const digits = identifier.replace(/\D/g, '');
    const mobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    if (/^\d{10}$/.test(mobile)) lookup.push({ mobile });
  }
  return User.findOne({ $or: lookup });
};

const registerUser = async (req, res) => {
  const { name, username, mobile, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }, { mobile }] });
    if (userExists) return res.status(400).json({ message: 'A user with this Email, Username, or Mobile already exists.' });

    const user = await User.create({ name, username, mobile, email, password, role });
    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, username: user.username, email: user.email, mobile: user.mobile, role: user.role, createdAt: user.createdAt,
        token: generateToken(user._id), 
      });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const loginUser = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }, { mobile: identifier }] });
    if (user && (await user.matchPassword(password))) {
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      const lastChange = user.lastPasswordChange || user.createdAt;

      // const sixMonthsAgo = new Date(Date.now() -  2 * 60 * 1000);     
      // const lastChange = user.lastPasswordChange || user.createdAt; 

      if (lastChange < sixMonthsAgo) {
        return res.status(403).json({
          requirePasswordChange: true,
          message: "Security Alert: Your password is older than 6 months and has expired. Please reset it.",
        });
      }

      res.json({
        _id: user._id, name: user.name, username: user.username, email: user.email, mobile: user.mobile, role: user.role, createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please check your details.' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { returnDocument: 'after' }).select('-password');
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateUser = async (req, res) => {
  try {
    if (((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))))._id.toString() !== req.params.id && ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))).role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name; 
    if (req.body.username) updateFields.username = req.body.username;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.mobile) updateFields.mobile = req.body.mobile;
    
    // Only allow Admins to change roles
    if (req.body.role && ((req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))._id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user))).id || (req.user._id || req.user.id || (req.user._id || req.user.id || (req.user._id || req.user.id || req.user)))).role === 'Admin') updateFields.role = req.body.role; 

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { returnDocument: 'after' }).select('-password');
    
    if (updatedUser) res.json(updatedUser);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const forgotPassword = async (req, res) => {
  const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
  if (!identifier) return res.status(400).json({ message: 'Enter your registered email or mobile number.' });

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found." });

    const realOtp = randomInt(100000, 1000000).toString();
    const isEmail = identifier.toLowerCase() === user.email.toLowerCase();
    const isPhoneIdentifier = /^[+\d\s()-]+$/.test(identifier);
    const digits = isPhoneIdentifier ? identifier.replace(/\D/g, '') : '';
    const mobileIdentifier = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    const isMobile = isPhoneIdentifier && mobileIdentifier === user.mobile;
    const email = isMobile && !isEmail ? undefined : user.email;
    const phone = isMobile && !isEmail ? user.mobile : undefined;

    user.resetOtp = realOtp;
    user.resetOtpExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      const channel = await sendNotifications({ email, phone, otp: realOtp });
      return res.json({ message: `OTP sent successfully to your registered ${channel === 'email' ? 'email' : 'mobile number'}.` });
    } catch (error) {
      user.resetOtp = undefined;
      user.resetOtpExpire = undefined;
      await user.save();
      console.error('Password reset OTP delivery failed:', error.message);
      const statusCode = error.code === 'NOTIFICATION_CONFIG' ? 503 : 502;
      return res.status(statusCode).json({
        message: error.code === 'NOTIFICATION_CONFIG'
          ? error.message
          : 'OTP delivery failed. Check the configured email or SMS provider and try again.',
      });
    }
  } catch (error) {
    console.error('Password reset request failed:', error.message);
    return res.status(500).json({ message: 'Unable to process the password reset request.' });
  }
};

const verifyOtp = async (req, res) => {
  const { identifier, otp } = req.body;
  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!/^\d{6}$/.test(String(otp || '')) || user.resetOtp !== otp) return res.status(400).json({ message: "Invalid OTP." });
    if (!user.resetOtpExpire || user.resetOtpExpire.getTime() <= Date.now()) return res.status(400).json({ message: "OTP has expired." });

    res.json({ message: "OTP Verified Successfully!" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const resetPassword = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!/^\d{6}$/.test(String(otp || '')) || user.resetOtp !== otp) return res.status(400).json({ message: "Invalid OTP." });
    if (!user.resetOtpExpire || user.resetOtpExpire.getTime() <= Date.now()) return res.status(400).json({ message: "OTP has expired." });
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    user.password = newPassword;
    user.lastPasswordChange = Date.now();
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save(); 

    res.json({ message: "Password reset successfully! You may now log in." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { registerUser, loginUser, getUsers, deleteUser, updateUserRole, updateUser, forgotPassword, verifyOtp, resetPassword };
