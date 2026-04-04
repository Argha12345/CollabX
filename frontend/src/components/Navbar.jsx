import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User as UserIcon, Bell, Check } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then((res) => {
        setNotifications(res.data);
      }).catch(err => console.error(err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const location = useLocation();
  if (['/login', '/register', '/profile'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="bg-white shadow w-full">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600">
              <img src="/logo.png" alt="CollabX Logo" className="h-8 object-contain" />
              <span className="hidden sm:block">CollabX</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">Dashboard</Link>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 hover:text-primary-600 transition"
                  >
                    <Bell size={20} />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                           <div className="p-4 text-sm text-center text-gray-500">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n._id} className={`p-4 border-b border-gray-50 text-sm flex justify-between items-start ${!n.read ? 'bg-primary-50/50' : ''}`}>
                              <div>{n.message}</div>
                              {!n.read && (
                                <button 
                                  onClick={async () => {
                                    await api.put(`/notifications/${n._id}/read`);
                                    setNotifications(notifications.map(no => no._id === n._id ? { ...no, read: true } : no));
                                  }} 
                                  className="text-primary-600 hover:bg-primary-100 p-1 rounded"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <span className="font-medium">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors bg-gray-100 px-3 py-1 rounded-md"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium">Login</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
