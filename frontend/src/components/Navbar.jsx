import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User as UserIcon, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hide navbar on auth pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
    }}>
      <div className="w-full px-4 sm:px-8 lg:px-14">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: '#fff8f3',
              borderRadius: '10px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(249,115,22,0.2)',
              boxShadow: '0 1px 4px rgba(249,115,22,0.12)',
              transition: 'all 0.2s',
            }}>
              <img src="/logo.png" alt="CollabX Logo" style={{ height: 26, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <span style={{
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.03em',
              color: '#f97316',
            }}>
              Collab<span style={{ color: '#111827' }}>X</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            {user ? (
              <>
                {/* Dashboard link */}
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5"
                  style={{
                    color: location.pathname === '/dashboard' ? '#f97316' : '#6b7280',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: location.pathname === '/dashboard' ? 'rgba(249,115,22,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { if (location.pathname !== '/dashboard') { e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; }}}
                  onMouseOut={e => { if (location.pathname !== '/dashboard') { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: '#e5e7eb', margin: '0 4px' }} />

                {/* Notifications */}
                <NotificationCenter />

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: '#e5e7eb', margin: '0 4px' }} />

                {/* User Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: dropdownOpen ? 'rgba(249,115,22,0.07)' : 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '5px 10px 5px 5px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => { if (!dropdownOpen) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseOut={e => { if (!dropdownOpen) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Avatar */}
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 2px rgba(249,115,22,0.3)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px rgba(249,115,22,0.3)',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                    )}
                    {/* Name */}
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#111827',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }} className="hidden sm:block">
                      {user?.name}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: '#9ca3af',
                        transition: 'transform 0.2s',
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      className="hidden sm:block"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      background: '#fff',
                      borderRadius: '14px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.07)',
                      minWidth: 200,
                      overflow: 'hidden',
                      animation: 'fadeInDown 0.15s ease',
                      zIndex: 200,
                    }}>
                      {/* User info header */}
                      <div style={{
                        padding: '14px 16px 10px',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(234,88,12,0.03) 100%)',
                      }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{user?.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>

                      {/* Profile link */}
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '11px 16px',
                          color: '#374151',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          textDecoration: 'none',
                          transition: 'background 0.12s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: '8px',
                          background: 'rgba(99,102,241,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <UserIcon size={15} style={{ color: '#6366f1' }} />
                        </div>
                        My Profile
                      </Link>

                      {/* Divider */}
                      <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }} />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '11px 16px',
                          color: '#ef4444',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          background: 'transparent',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          marginBottom: '4px',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#fff5f5'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: '8px',
                          background: 'rgba(239,68,68,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <LogOut size={15} style={{ color: '#ef4444' }} />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#6b7280',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(249,115,22,0.45)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(249,115,22,0.35)'; }}
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
