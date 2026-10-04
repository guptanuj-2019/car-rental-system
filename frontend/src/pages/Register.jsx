import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); 
  const [mobile, setMobile] = useState('');     
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Customer');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!email.includes('@')) {
      return // alert("Invalid Email: Must contain an '@' symbol.");
    }
    if (mobile.length !== 10 || isNaN(mobile)) {
      return // alert("Invalid Mobile: Must be exactly 10 digits.");
    }

    try {
      const { data } = await API.post('/users/register', { name, username, mobile, email, password, role });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      // alert(`Successfully registered as ${data.role}!`);
      
      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'Rental Staff') navigate('/staff');
      else navigate('/');
      
    } catch (error) {
      // alert(error.response?.data?.message || 'Registration Failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-12">
      <form onSubmit={submitHandler} className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register Account</h2>
        
        <input 
          type="text" placeholder="Full Name" className="w-full mb-4 p-2 border rounded focus:border-blue-500 outline-none"
          value={name} onChange={(e) => setName(e.target.value)} required 
        />
        
        <input 
          type="text" placeholder="Unique Username (e.g., anuj123)" className="w-full mb-4 p-2 border rounded focus:border-blue-500 outline-none"
          value={username} onChange={(e) => setUsername(e.target.value)} required 
        />
        
        <input 
          type="text" placeholder="10-Digit Mobile Number" maxLength="10" className="w-full mb-4 p-2 border rounded focus:border-blue-500 outline-none"
          value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required 
        />

        <input 
          type="email" placeholder="Email Address" className="w-full mb-4 p-2 border rounded focus:border-blue-500 outline-none"
          value={email} onChange={(e) => setEmail(e.target.value)} required 
        />
        <input 
          type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded focus:border-blue-500 outline-none"
          value={password} onChange={(e) => setPassword(e.target.value)} required 
        />
        
        <select 
          className="w-full mb-6 p-2 border rounded bg-white font-semibold text-gray-700 outline-none focus:border-blue-500"
          value={role} onChange={(e) => setRole(e.target.value)}
        >
          <option value="Customer">Join as Customer</option>
          <option value="Rental Staff">Join as Rental Staff</option>
          <option value="Admin">Join as Admin</option>
        </select>

        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 mb-4 font-bold transition shadow-sm">
          Register
        </button>

        <div className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login here</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
