import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { User as UserIcon, Camera, LayoutDashboard, Settings, LogOut, CheckCircle2, Trash2 } from 'lucide-react';

const Profile = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be under 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result }); // Convert to Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Update Profile Information (Handles Native strings OR Base64 files natively)
      const { data } = await api.put('/users/profile', profileData);
      updateUser(data);
      
      // 2. Process Password Change Request (If typed)
      if (passwordData.oldPassword && passwordData.newPassword) {
         if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Profile saved, but the new passwords do not match!' });
            return;
         }
         await api.put('/users/password', {
           oldPassword: passwordData.oldPassword,
           newPassword: passwordData.newPassword
         });
         setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
      
      setMessage({ type: 'success', text: 'All info successfully updated & verified!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'An error occurred during save' });
    } finally {
      setLoading(false);
    }
  };

  const nameParts = profileData.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#EBF0F6] p-4 sm:p-8">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[750px] relative">
        
        {/* Left Pane - Navigation Overlay */}
        <div className="w-full md:w-1/3 lg:w-[30%] bg-primary-500 text-white flex flex-col items-center py-16 px-6 relative z-10">
          
          <div 
            className="relative group cursor-pointer mb-4" 
            onClick={() => fileInputRef.current.click()}
            title="Click to upload photo"
          >
            <div className="w-36 h-36 rounded-full border-[6px] border-primary-400 flex items-center justify-center bg-primary-600 overflow-hidden shadow-lg transition transform group-hover:scale-105">
              {profileData.avatar ? (
                 <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <UserIcon size={64} className="text-white/80" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
              <Camera size={28} className="text-white" />
            </div>
            
            <div className="absolute bottom-1 right-2 bg-white rounded-full p-2 border-4 border-primary-500 text-primary-600 shadow-md pointer-events-none">
              <Camera size={14} className="ml-0.5" />
            </div>
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
          
          {profileData.avatar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileData({...profileData, avatar: ''});
              }}
              className="flex items-center space-x-1.5 text-primary-200 hover:text-white text-xs font-medium mb-4 bg-white/10 hover:bg-red-500/80 px-3 py-1.5 rounded-full transition"
            >
              <Trash2 size={12} />
              <span>Remove photo</span>
            </button>
          )}
          
          <h2 className="text-2xl font-medium mb-12 tracking-wide font-sans">
            Welcome, {user?.name?.split(' ')[0] || 'User'}
          </h2>
          
          <nav className="w-full px-2 space-y-2 flex flex-col text-primary-100 font-medium">
             <Link to="/dashboard" className="flex items-center space-x-5 py-3.5 px-6 hover:bg-white/10 rounded-2xl transition">
                <LayoutDashboard size={22} className="opacity-80" />
                <span>Dashboard</span>
             </Link>
             <div className="flex items-center space-x-5 py-3.5 px-6 bg-white/20 text-white rounded-2xl border-l-[6px] border-white cursor-pointer relative -left-1.5 w-[calc(100%+0.3rem)]">
                <Settings size={22} />
                <span className="flex-1">Settings</span>
             </div>
          </nav>

          <div className="mt-auto w-full pt-8">
             <div 
               className="flex items-center space-x-5 py-3.5 px-6 hover:bg-white/10 rounded-2xl transition text-primary-100 hover:text-white cursor-pointer"
               onClick={() => { logout(); navigate('/'); }}
             >
               <LogOut size={22} className="opacity-80" />
               <span className="font-medium">Log Out</span>
             </div>
          </div>
        </div>

        {/* Right Pane - Form Data View */}
        <div className="w-full md:w-2/3 lg:w-[70%] bg-white p-8 md:p-16 flex flex-col relative">
          
          {message.text && (
            <div className={`absolute top-6 right-10 p-4 rounded-xl shadow-md border flex items-center space-x-2 z-20 transition-all ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <CheckCircle2 size={20} />
              <span className="font-medium text-sm">{message.text}</span>
            </div>
          )}

          <div className="text-center md:text-center w-full mb-14">
            <h1 className="text-[2.5rem] font-bold text-gray-200 tracking-wider">Your personal profile info</h1>
          </div>

          <form onSubmit={handleSaveInfo} className="flex-1 flex flex-col">
            <div className="flex flex-col lg:flex-row lg:space-x-12">
               
               {/* Column 1: Personal Info */}
               <div className="flex-1 space-y-6">
                 <div className="flex items-center text-primary-500 mb-6 font-bold tracking-wide">
                    <span className="bg-primary-500 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3 text-sm">1</span>
                    <span className="text-gray-300 text-xl tracking-widest font-black">PROFILE</span>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">Full name</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-[#F5F8FA] border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-700 font-medium transition"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      required
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">Your e-mail</label>
                    <input 
                      type="email" 
                      className="w-full px-6 py-4 bg-[#F5F8FA] border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-700 font-medium transition"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      required
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">Username (not your e-mail)</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full px-6 py-4 bg-[#F5F8FA] opacity-70 border-none rounded-2xl focus:ring-max text-gray-700 font-medium cursor-not-allowed"
                      value={user?.name ? user.name.toLowerCase().replace(' ', '') + Date.now().toString().slice(-4) : ''}
                    />
                 </div>
               </div>

               {/* Column 2: Password Setting */}
               <div className="flex-1 space-y-6 mt-12 lg:mt-0">
                 <div className="flex items-center text-primary-500 mb-6 font-bold tracking-wide">
                    <span className="bg-primary-500 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3 text-sm">2</span>
                    <span className="text-gray-300 text-xl tracking-widest font-black">PASSWORD</span>
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">Old password <span className="text-red-500">*</span></label>
                    <input 
                      type="password" 
                      className="w-full px-6 py-4 bg-[#F5F8FA] border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-700 font-medium transition placeholder-gray-300"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">New password <span className="text-red-500">*</span></label>
                    <input 
                      type="password" 
                      className="w-full px-6 py-4 bg-[#F5F8FA] border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-700 font-medium transition placeholder-gray-300"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="••••••••"
                      minLength={6}
                      autoComplete="new-password"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-4">Confirm new password <span className="text-red-500">*</span></label>
                    <input 
                      type="password" 
                      className="w-full px-6 py-4 bg-[#F5F8FA] border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-700 font-medium transition placeholder-gray-300"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={6}
                    />
                 </div>

                 <div className="pt-8 w-full flex justify-end lg:justify-start">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full lg:w-auto px-10 py-4 bg-[#0ea5e9] hover:bg-sky-600 text-white font-bold tracking-wide rounded-2xl shadow-lg transition transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Correct. Save info'}
                    </button>
                 </div>
               </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;
