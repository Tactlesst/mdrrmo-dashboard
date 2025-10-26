'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Reports from './Reports';
import Users from './Users';
import ManagePCRForm from './ManagePCRForm';
import Logs from './Logs';
import AdminProfileModal from './AdminProfileModal';
import OnlineAdminsList from './OnlineAdminsList';
import Inbox from './Inbox';
import Settings from './Settings';
import { FiBell, FiX, FiCheck, FiChevronDown, FiChevronUp, FiInbox, FiEye, FiEyeOff, FiSettings } from 'react-icons/fi';

const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });
const Alerts = dynamic(() => import('./Alerts'), { ssr: false });

export default function DashboardContent({ user }) {
  const [admin, setAdmin] = useState({ name: '', email: '', profile_image_url: '' });
  const [activeContent, setActiveContent] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [error, setError] = useState(null);
  const [viewAllNotifications, setViewAllNotifications] = useState(true);
  const [headerNotifFilter, setHeaderNotifFilter] = useState('alerts');
  // Settings state moved into components/Settings.js
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Format date for relative time in Asia/Manila timezone
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return 'N/A';
      }

      const dateManila = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const now = new Date();
      const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

      const diffMs = nowManila - dateManila;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      console.log(`Notification date: ${dateString}, Manila: ${dateManila}, Now: ${nowManila}, Diff: ${diffMins} mins`);

      if (diffMs < 0 || diffMins < 1) {
        return 'just now';
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        const options = { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' };
        return date.toLocaleString('en-PH', options);
      }
    } catch (error) {
      console.error(`Error formatting relative time ${dateString}:`, error);
      return 'N/A';
    }
  };

  // Fetch admin profile
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        const data = await res.json();
        if (data?.admin) {
          setAdmin(data.admin);
        } else {
          console.warn('No admin data found.');
        }
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
      }
    };
    fetchAdmin();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const url = viewAllNotifications
        ? `/api/notifications?showAll=true`
        : `/api/notifications?userId=${user.id}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data?.notifications) {
        const validNotifications = data.notifications.filter(n => n.id && Number.isInteger(Number(n.id)));
        if (validNotifications.length < data.notifications.length) {
          console.warn('Some notifications have invalid IDs:', data.notifications);
        }
        console.log('Fetched notifications:', validNotifications);
        setNotifications(validNotifications);
      } else {
        console.warn('No notifications found.');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user.id, viewAllNotifications]);

  // Settings are handled inside <Settings />

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setError(null);
      const id = Number(notificationId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid notification ID: Must be a positive number');
      }
      console.log('Marking notification as read:', { notificationId: id });
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to mark notification as read: ${res.status} ${res.statusText} - ${errorData.message || 'No additional details'}`);
      }
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification({ ...selectedNotification, is_read: true });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError(err.message);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setError(null);
      const url = viewAllNotifications 
        ? '/api/notifications?showAll=true'
        : '/api/notifications';
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, showAll: viewAllNotifications }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to mark all notifications as read: ${res.status} ${res.statusText}`);
      }
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setSelectedNotification(null);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError(err.message);
    }
  };

  // Handle notification click to show details
  const handleNotificationClick = (notification) => {
    if (!notification) {
      console.error('Notification is undefined or null');
      setError('Cannot process notification: Invalid data');
      return;
    }
    setSelectedNotification(notification);
    setShowNotifications(false);
    if (!notification.is_read) {
      if (!notification.id) {
        console.error('Invalid notification ID:', notification);
        setError('Cannot mark notification as read: Missing or invalid ID');
        return;
      }
      handleMarkAsRead(notification.id);
    }
  };

  // Close notification details
  const handleCloseDetails = () => {
    setSelectedNotification(null);
  };

  // Toggle between viewing all notifications and personal notifications
  const toggleViewAll = () => {
    setViewAllNotifications(!viewAllNotifications);
    setShowNotifications(true);
  };

  const handleLogout = async () => {
    try {
      // Prefer sendBeacon to avoid aborted fetch errors on navigation/unload
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const payload = new Blob([JSON.stringify({})], { type: 'application/json' });
        navigator.sendBeacon('/api/logout', payload);
      } else {
        // Fallback: keepalive fetch with a short timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
          await fetch('/api/logout', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      }
    } catch (e) {
      // Swallow network abort errors caused by navigation
    } finally {
      window.location.assign('/login');
    }
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    )},
    { id: 'alerts', name: 'Alerts', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.06 19h13.88c1.54 0 2.5-1.66 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.34.19 3 1.72 3z" />
        </svg>
    )},
    { id: 'inbox', name: 'Inbox', icon: <FiInbox className="w-5 h-5" /> },
    { id: 'users', name: 'Users', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m3-2h4m10 0a2 2 0 100-4 2 2 0 000 4zM13 8a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )},
    { id: 'online-admins', name: 'Online Status', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354l-7 7A.993.993 0 004 12v8a2 2 0 002 2h12a2 2 0 002-2v-8a.993.993 0 00-.354-.707l-7-7a.993.993 0 00-1.392 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4m10 4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4z" />
        </svg>
    )},
    { id: 'manage-pcr-form', name: 'Manage PCR form', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    )},
    { id: 'reports', name: 'Reports', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z" />
        </svg>
    )},
    { id: 'logs', name: 'Logs', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
    )},
    { id: 'settings', name: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    setActiveContent(savedTab || 'dashboard');
  }, []);

  useEffect(() => {
    if (activeContent) {
      localStorage.setItem('activeTab', activeContent);
    }
  }, [activeContent]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 font-sans flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 p-2"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg px-6 py-4 flex items-center justify-between rounded-b-md">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative w-15 h-15 hidden sm:block">
            <Image src="/Logoo.png" alt="MDRRMO" fill sizes="60px" className="object-contain" priority />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MDRRMO Accident Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative focus:outline-none"
            >
              <FiBell className="w-6 h-6 text-white" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[22rem] md:w-[28rem] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">
                    {viewAllNotifications ? 'All Notifications' : 'My Notifications'}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-white border border-gray-200 rounded-full p-0.5">
                      <button
                        onClick={() => setHeaderNotifFilter('alerts')}
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${headerNotifFilter === 'alerts' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Alerts
                      </button>
                      <button
                        onClick={() => setHeaderNotifFilter('system')}
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${headerNotifFilter === 'system' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        System
                      </button>
                      <button
                        onClick={() => setHeaderNotifFilter('other')}
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${headerNotifFilter === 'other' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Others
                      </button>
                    </div>
                    <button
                      onClick={toggleViewAll}
                      className="text-xs md:text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                      title={viewAllNotifications ? 'View only my notifications' : 'View all notifications'}
                    >
                      {viewAllNotifications ? <FiEyeOff className="w-4 h-4 md:mr-1" /> : <FiEye className="w-4 h-4 md:mr-1" />}
                      <span className="hidden md:inline">{viewAllNotifications ? 'My View' : 'Admin View'}</span>
                    </button>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs md:text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                        title="Mark all read"
                      >
                        <FiCheck className="w-4 h-4 md:mr-1" />
                        <span className="hidden md:inline">Mark all read</span>
                      </button>
                    )}
                  </div>
                </div>
                {(() => {
                  const isAlert = (n) => ['admin','responder'].includes(n.sender_type);
                  const isSystem = (n) => n.sender_type === 'system';
                  const inFilter = (n) => {
                    if (headerNotifFilter === 'alerts') return isAlert(n);
                    if (headerNotifFilter === 'system') return isSystem(n);
                    if (headerNotifFilter === 'other') return !isAlert(n) && !isSystem(n);
                    return true;
                  };
                  const list = notifications.filter(inFilter).slice(0, 10);
                  if (list.length === 0) {
                    return <p className="p-3 text-sm text-gray-500">No notifications.</p>;
                  }
                  return list.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border-b border-gray-200 flex justify-between items-start cursor-pointer hover:bg-gray-50"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-800">
                            {notification.sender_name || 'System'}
                          </p>
                          {viewAllNotifications && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              To: {notification.recipient_name || `${notification.account_type}-${notification.account_id}`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(notification.created_at)}</p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 ml-2"
                          title="Mark as read"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ));
                })()}
                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setActiveContent('inbox');
                      setShowNotifications(false);
                    }}
                    className="w-full text-xs md:text-sm text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-md"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <span className="text-lg font-medium hidden sm:block">
                {admin.name || 'Admin'}
              </span>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                {admin.profile_image_url ? (
                  <img
                    src={admin.profile_image_url}
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
              </div>
              {showDropdown ? (
                <FiChevronUp className="w-4 h-4 text-white" />
              ) : (
                <FiChevronDown className="w-4 h-4 text-white" />
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowDropdown(false);
                  }}
                >
                  Edit Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {selectedNotification && (
        <div className="fixed inset-0 blur-2 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Notification Details</h3>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">From</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedNotification.sender_name || 'System'}
                </p>
              </div>
              {viewAllNotifications && (
                <div>
                  <p className="text-sm font-medium text-gray-500">To</p>
                  <p className="text-lg text-gray-800">
                    {selectedNotification.recipient_name || `${selectedNotification.account_type}-${selectedNotification.account_id}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Message</p>
                <p className="text-lg text-gray-800">{selectedNotification.message}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p className="text-lg text-gray-800">{formatRelativeTime(selectedNotification.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-lg text-gray-800 capitalize">{selectedNotification.account_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg text-gray-800 capitalize">
                  {selectedNotification.is_read ? 'Read' : 'Unread'}
                </p>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              {!selectedNotification.is_read && (
                <button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    handleCloseDetails();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
                >
                  Mark as Read & Close
                </button>
              )}
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row p-4 gap-4">
        <aside
          ref={sidebarRef}
          onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
          className={`bg-white text-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-20 items-center' : 'w-full md:w-64'}
            ${isSidebarCollapsed && 'fixed top-[90px] left-4 z-50 md:static'} md:relative`}
        >
          <div className="flex items-center mb-6 px-2">
            <div className="w-8 h-8 flex items-center justify-center mr-2">
              <svg className="w-6 h-6 text-black-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">MDRRMO</h2>
            )}
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveContent(item.id)}
                    className={`w-full flex items-center py-2 rounded-full transition-all duration-200 ease-in-out
                      ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}
                      ${activeContent === item.id
                        ? 'bg-gray-600 text-white font-semibold shadow-inner'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'}`}
                  >
                    <div className={`${isSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</div>
                    {!isSidebarCollapsed && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors duration-200"
            >
              <svg
                className={`w-5 h-5 ${isSidebarCollapsed ? 'rotate-180' : ''} transition-transform duration-200 ease-in-out`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!isSidebarCollapsed && <span className="ml-2 whitespace-nowrap">Collapse Sidebar</span>}
            </button>
          </div>
        </aside>

        {activeContent && (
          <main className="flex-1 bg-white rounded-xl shadow-md p-6 overflow-y-auto max-h-[calc(100vh-7rem)]">
            {activeContent === 'dashboard' && <MapDisplay />}
            {activeContent === 'alerts' && <Alerts />}
            {activeContent === 'inbox' && (
              <Inbox 
                notifications={notifications}
                viewAllNotifications={viewAllNotifications}
                onToggleViewAll={toggleViewAll}
                onMarkAllAsRead={handleMarkAllAsRead}
                onRefresh={fetchNotifications}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {activeContent === 'users' && <Users />}
            {activeContent === 'online-admins' && <OnlineAdminsList />}
            {activeContent === 'manage-pcr-form' && <ManagePCRForm />}
            {activeContent === 'reports' && <Reports />}
            {activeContent === 'logs' && <Logs />}
            {activeContent === 'settings' && <Settings />}
          </main>
        )}
      </div>
      
      {showProfileModal && (
        <AdminProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}