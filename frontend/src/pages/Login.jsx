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
          setResetMessage(error.response?.data?.message || 'Login Failed');
        }
      }
    };

    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <form onSubmit={submitHandler} className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200 relative">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">System Login</h2>
          <input type="text" placeholder="Email, Username, or Mobile" className="w-full mb-4 p-3 border rounded focus:border-blue-500 outline-none" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full mb-2 p-3 border rounded focus:border-blue-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 mb-4 font-bold shadow-sm transition">Login</button>
        </form>
      </div>
    );
};

export default Login;
