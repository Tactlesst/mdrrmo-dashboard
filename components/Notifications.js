'use client';

import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [viewAllNotifications, setViewAllNotifications] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState(null);
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

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setError(null);
      const id = Number(notificationId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid notification ID: Must be a positive number');
      }
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
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setSelectedNotification(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-red-50 font-sans p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
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

      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg px-6 py-4 rounded-b-md mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={toggleViewAll}
              className="flex items-center text-sm text-white hover:text-gray-200"
              title={viewAllNotifications ? 'View only my notifications' : 'View all notifications'}
            >
              {viewAllNotifications ? <FiEyeOff className="w-4 h-4 mr-1" /> : <FiEye className="w-4 h-4 mr-1" />}
              {viewAllNotifications ? 'My Notifications' : 'All Notifications'}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {viewAllNotifications ? 'All Notifications' : 'My Notifications'}
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="ml-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </h2>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications found.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-md flex justify-between items-start cursor-pointer hover:bg-gray-50 ${notification.is_read ? 'bg-gray-50' : ''}`}
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
                  {notification.is_read && (
                    <p className="text-xs text-green-600 mt-1">Read</p>
                  )}
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
            ))}
          </div>
        )}
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}