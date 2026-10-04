const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, deleteUser, updateUserRole,updateUser, forgotPassword,verifyOtp,resetPassword} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, adminOnly, getUsers);
router.delete('/:id', protect, adminOnly, deleteUser);
router.put('/:id/role', protect, adminOnly, updateUserRole);
router.put('/:id', protect, updateUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


module.exports = router;
