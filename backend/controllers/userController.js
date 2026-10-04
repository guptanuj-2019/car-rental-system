const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendRegistrationAlert, alert } = require('../utils/sendNotifications');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, username, mobile, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }, { mobile }] });
    if (userExists) return res.status(400).json({ message: 'A user with this Email, Username, or Mobile already exists.' });

    const user = await User.create({ name, username, mobile, email, password, role });
    if (user) {
      sendRegistrationwindow.alert(user); 
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
  const { identifier } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { mobile: identifier }, { username: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found." });

    const realOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await User.findByIdAndUpdate(user._id, {
      resetOtp: realOtp,
      resetOtpExpire: Date.now() + 5 * 60 * 1000 
    });

    window.alert(user.email, user.mobile, realOtp);

    res.json({ message: `OTP sent successfully to your registered Email and Mobile.` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const verifyOtp = async (req, res) => {
  const { identifier, otp } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { mobile: identifier }, { username: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.resetOtp !== otp) return res.status(400).json({ message: "Invalid OTP." });
    if (user.resetOtpExpire < Date.now()) return res.status(400).json({ message: "OTP has expired." });

    res.json({ message: "OTP Verified Successfully!" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const resetPassword = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { mobile: identifier }, { username: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.resetOtp !== otp) return res.status(400).json({ message: "Invalid OTP." });
    if (user.resetOtpExpire < Date.now()) return res.status(400).json({ message: "OTP has expired." });

    user.password = newPassword;
    user.lastPasswordChange = Date.now();
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save(); 

    res.json({ message: "Password reset successfully! You may now log in." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { registerUser, loginUser, getUsers, deleteUser, updateUserRole, updateUser, forgotPassword, verifyOtp, resetPassword };



