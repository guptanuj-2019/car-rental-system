import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', mobile: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser) {
      navigate('/login');
    } else {
      setUserInfo(storedUser);
      setEditForm({
        name: storedUser.name || '',
        username: storedUser.username || '',
        email: storedUser.email || '',
        mobile: storedUser.mobile || ''
      });
    }
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put(`/users/${userInfo._id}`, editForm);
      
      const updatedUserInfo = {
        ...userInfo,
        name: data.name,
        username: data.username,
        email: data.email,
        mobile: data.mobile,
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
      
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (!userInfo) return <div className="p-10 text-center font-bold">Loading Profile...</div>;

  const joinDate = userInfo.createdAt 
    ? new Date(userInfo.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[80vh]">
      
      {/* --- ADDED BACK BUTTON NEXT TO TITLE --- */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">
          My Profile
        </h1>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition shadow-sm text-sm"
        >
          ← Go Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-indigo-800 font-semibold flex justify-between items-center">
          <span>Personal Account Details</span>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 font-bold text-sm shadow-sm transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* --- PROFILE CONTENT AREA --- */}
        <div className="p-6">
          
          {!isEditing ? (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-4 p-4 items-center border-b border-gray-100">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Full Name</div>
                <div className="col-span-2 text-lg font-semibold text-gray-900">{userInfo.name}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 items-center bg-gray-50 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Username</div>
                <div className="col-span-2 text-md font-mono text-gray-700">@{userInfo.username}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 items-center border-b border-gray-100">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Email Address</div>
                <div className="col-span-2 text-md text-gray-800">{userInfo.email}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 items-center bg-gray-50 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Mobile Number</div>
                <div className="col-span-2 text-md text-gray-800">{userInfo.mobile || 'Not Provided'}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 items-center">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Joined On</div>
                <div className="col-span-2 text-md text-gray-800 font-medium">{joinDate}</div>
              </div>
            </div>

          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl mx-auto mt-4">
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Update Account Information</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-gray-50 font-medium" required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} 
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-gray-50 font-mono" required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input 
                    type="text" maxLength="10" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value.replace(/\D/g, '')})} 
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-gray-50" required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-gray-50" required 
                />
              </div>

              <div className="flex space-x-4 pt-6 border-t border-gray-200 mt-10">
                <button type="submit" className="w-2/3 bg-emerald-600 text-white p-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-md text-lg">
                  Save Changes
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="w-1/3 bg-red-500 text-white p-3 rounded-lg font-bold hover:bg-red-600 transition shadow-md text-lg">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;