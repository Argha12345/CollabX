import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, Check, ExternalLink, Inbox } from 'lucide-react';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket && user) {
      socket.emit('register-user', user.id);
      
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Optional: Play a sound or show a toast
      };

      socket.on('new-notification', handleNewNotification);
      return () => socket.off('new-notification', handleNewNotification);
    }
  }, [socket, user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Inbox size={16} /> <span>Notifications</span>
            </h3>
            <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {unreadCount} New
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-4 border-b border-gray-50 last:border-0 transition hover:bg-gray-50 group flex flex-col ${!notification.read ? 'bg-primary-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${!notification.read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification._id)}
                        className="text-primary-500 hover:text-primary-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                    {notification.link && (
                      <Link 
                        to={notification.link} 
                        onClick={() => { setIsOpen(false); markAsRead(notification._id); }}
                        className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1"
                      >
                        Details <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-gray-50 text-center">
            <button className="text-xs font-bold text-gray-500 hover:text-gray-800 transition">View All Activity</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
