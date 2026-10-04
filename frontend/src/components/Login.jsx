import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('Enter your Email or Mobile Number to receive an OTP.');
  
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (resetStep === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, resetStep]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/users/login', { identifier, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'Rental Staff') navigate('/staff');
      else navigate('/');
      
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.requirePasswordChange) {
        setResetMessage(error.response.data.message);
        setResetIdentifier(identifier);
        setResetStep(1);
        setShowModal(true);
      } else {
        window.alert(error.response?.data?.message || 'Login Failed');
      }
    }
  };

  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    try {
      const { data } = await API.post('/users/forgot-password', { identifier: resetIdentifier });
      setResetMessage(data.message || "OTP sent successfully! Valid for 5 mins.");
      setTimeLeft(60);
      setResetStep(2);
    } catch (error) {
      setResetMessage(error.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/verify-otp', { identifier: resetIdentifier, otp });
      setResetMessage("OTP Verified! Securely enter your new password.");
      setResetStep(3);
    } catch (error) {
      setResetMessage(error.response?.data?.message || 'Invalid or Expired OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetMessage("Passwords do not match! Please check again.");
      return;
    }

    try {
      const { data } = await API.post('/users/reset-password', { 
        identifier: resetIdentifier, 
        otp, 
        newPassword 
      });
      window.alert(data.message || 'Password updated successfully!');
      setShowModal(false);
      setIdentifier(resetIdentifier);
      setPassword(newPassword); 
    } catch (error) {
      setResetMessage(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form onSubmit={submitHandler} className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200 relative">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">System Login</h2>
        
        <input 
          type="text" placeholder="Email, Username, or Mobile" 
          className="w-full mb-4 p-3 border rounded focus:border-blue-500 outline-none"
          value={identifier} onChange={(e) => setIdentifier(e.target.value)} required 
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full mb-2 p-3 border rounded focus:border-blue-500 outline-none"
          value={password} onChange={(e) => setPassword(e.target.value)} required 
        />

        <div className="text-right mb-6">
          <button type="button" onClick={() => { 
            setResetMessage('Enter your Email or Mobile Number to receive an OTP.'); 
            setResetIdentifier(identifier); 
            setOtp(''); setNewPassword(''); setConfirmPassword('');
            setResetStep(1); 
            setShowModal(true); 
          }} className="text-sm text-blue-600 hover:underline font-medium">
            Forgot Password?
          </button>
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 mb-4 font-bold shadow-sm transition">
          Login
        </button>

        <div className="text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
        </div>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">?</button>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Reset Password</h2>
            <p className={	ext-sm mb-6 font-medium }>{resetMessage}</p>

            {resetStep === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <input type="text" placeholder="Email or Mobile Number" value={resetIdentifier} onChange={(e) => setResetIdentifier(e.target.value)} className="w-full p-3 border rounded outline-none focus:border-blue-500" required />
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">Send OTP</button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input 
                  type="text" placeholder="Enter 6-Digit OTP" maxLength="6" 
                  value={otp} onChange={(e) => setOtp(e.target.value)} 
                  className="w-full p-3 border rounded outline-none focus:border-blue-500 tracking-widest text-center font-bold text-lg" required 
                />
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition shadow-sm">
                  Verify OTP
                </button>
                
                <div className="flex justify-between items-center mt-4">
                  <button type="button" onClick={() => { setResetStep(1); setOtp(''); }} className="text-blue-600 font-semibold text-sm hover:text-blue-800 hover:underline transition">
                    Change Email/Mobile
                  </button>
                  
                  {timeLeft > 0 ? (
                    <span className="text-sm font-bold text-orange-500">
                      Resend in {timeLeft}s
                    </span>
                  ) : (
                    <button type="button" onClick={handleRequestOTP} className="text-green-600 font-bold text-sm hover:text-green-800 hover:underline transition">
                      Resend OTP Now
                    </button>
                  )}
                </div>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account</label>
                  <input type="text" value={resetIdentifier} disabled className="w-full p-3 border rounded bg-gray-100 text-gray-600 font-medium cursor-not-allowed" />
                </div>
                
                <input type="password" placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border rounded outline-none focus:border-blue-500" required />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded outline-none focus:border-blue-500" required />
                
                <button type="submit" className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition shadow-md">Update Password</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
