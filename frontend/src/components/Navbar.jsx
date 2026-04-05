import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import FlowTimer from './FlowTimer';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const location = useLocation();
  if (['/login', '/register', '/profile'].includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow w-full">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600 group">
              <div className="bg-primary-50 p-1.5 rounded-lg group-hover:bg-primary-100 transition shadow-sm">
                <img src="/logo.png" alt="CollabX Logo" className="h-6 object-contain" />
              </div>
              <span className="hidden sm:block tracking-tight">Collab<span className="text-gray-900">X</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-bold text-sm tracking-wide uppercase transition-colors">Dashboard</Link>
                
                <div className="flex items-center space-x-6 border-l border-gray-100 pl-8">
                  <NotificationCenter />
                  
                  <div className="flex items-center space-x-3 ml-2 border-l border-gray-100 pl-6">
                    <div className="flex flex-col items-end mr-1 select-none">
                      <span className="font-bold text-sm leading-none text-gray-900">{user?.name}</span>
                    </div>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white ring-2 ring-gray-100 shadow-sm transition" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center border-2 border-white ring-2 ring-primary-100 shadow-sm">
                        <UserIcon size={18} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-bold text-sm tracking-wide uppercase">Login</Link>
                <Link to="/register" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-100 hover:bg-primary-700 hover:shadow-primary-200 transition active:scale-95">
                  Sign Up Free
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
