'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff, FiSearch, FiRefreshCw, FiInbox } from 'react-icons/fi';

export default function Inbox({
  notifications,
  onMarkAllAsRead,
  onRefresh,
  onNotificationClick,
  isLoading,
}) {
  const [inboxFilter, setInboxFilter] = useState('alerts');
  const [inboxSearch, setInboxSearch] = useState('');
  
  // Note: notifications prop is already filtered in DashboardContent:
  // - System notifications: shown globally for all users
  // - Alerts (responder/alerts1): shown globally for all users
  // - Chat: shown globally for all users
  // - Admin (admin actions): shown globally for all users
  // - Others: filtered to current user only

  // Format date for Manila timezone
  const formatPHDate = (dateString) => {
    if (!dateString) {
      console.warn('No dateString provided for formatPHDate');
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string for formatPHDate: ${dateString}`);
        return 'N/A';
      }
      const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const formatted = date.toLocaleString('en-PH', options);
      console.log(`formatPHDate: input=${dateString}, output=${formatted}`);
      return formatted;
    } catch (error) {
      console.error(`Error formatting date ${dateString}:`, error);
      return 'N/A';
    }
  };

  // Format date for relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) {
      console.warn('No dateString provided for formatRelativeTime');
      return 'N/A';
    }
    try {
      // Parse the date string directly (it's already in UTC from the database)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return 'N/A';
      }

      // Get current time
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Return relative time
      if (diffSecs < 30) {
        return 'just now';
      } else if (diffMins < 1) {
        return `${diffSecs} sec${diffSecs !== 1 ? 's' : ''} ago`;
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return formatPHDate(dateString);
      }
    } catch (error) {
      console.error(`Error formatting relative time ${dateString}:`, error);
      return 'N/A';
    }
  };

  // Categorize and filter notifications
  const categorizedNotifications = {
    alerts: [],
    chat: [],
    admin: [],
    system: [],
    other: [],
  };

  notifications.forEach((notification) => {
    const searchTerm = inboxSearch.toLowerCase();
    const matchesSearch =
      inboxSearch
        ? notification.message.toLowerCase().includes(searchTerm) ||
          (notification.sender_name &&
            notification.sender_name.toLowerCase().includes(searchTerm)) ||
          (notification.recipient_name &&
            notification.recipient_name.toLowerCase().includes(searchTerm))
        : true;

    const type = (notification.sender_type || '').toLowerCase();
    const isAlert = type === 'responder' || type === 'alerts1';
    const isChat = type === 'chat';
    const isAdminCat = type === 'admin';
    const isSystem = type === 'system';
    const matchesFilter =
      (inboxFilter === 'alerts' && isAlert) ||
      (inboxFilter === 'chat' && isChat) ||
      (inboxFilter === 'admin' && isAdminCat) ||
      (inboxFilter === 'system' && isSystem) ||
      (inboxFilter === 'other' && !isAlert && !isChat && !isAdminCat && !isSystem);

    if (matchesSearch && matchesFilter) {
      if (type === 'responder' || type === 'alerts1') {
        categorizedNotifications.alerts.push(notification);
      } else if (type === 'chat') {
        categorizedNotifications.chat.push(notification);
      } else if (type === 'admin') {
        categorizedNotifications.admin.push(notification);
      } else if (type === 'system') {
        categorizedNotifications.system.push(notification);
      } else {
        categorizedNotifications.other.push(notification);
      }
    }
  });

  // Sort notifications within each category by created_at (descending)
  const orderedCategories = [
    { name: 'Alerts', key: 'alerts', notifications: categorizedNotifications.alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
    { name: 'Chat Messages', key: 'chat', notifications: categorizedNotifications.chat.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
    { name: 'Admin Notifications', key: 'admin', notifications: categorizedNotifications.admin.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
    { name: 'System Notifications', key: 'system', notifications: categorizedNotifications.system.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
    { name: 'Other Notifications', key: 'other', notifications: categorizedNotifications.other.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notification Inbox</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="Refresh inbox"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={inboxSearch}
              onChange={(e) => setInboxSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1">
            <button
              onClick={() => setInboxFilter('alerts')}
              className={`px-3 py-1.5 text-sm rounded-full ${inboxFilter === 'alerts' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Alerts
            </button>
            <button
              onClick={() => setInboxFilter('chat')}
              className={`px-3 py-1.5 text-sm rounded-full ${inboxFilter === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setInboxFilter('admin')}
              className={`px-3 py-1.5 text-sm rounded-full ${inboxFilter === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Admin
            </button>
            <button
              onClick={() => setInboxFilter('system')}
              className={`px-3 py-1.5 text-sm rounded-full ${inboxFilter === 'system' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              System
            </button>
            <button
              onClick={() => setInboxFilter('other')}
              className={`px-3 py-1.5 text-sm rounded-full ${inboxFilter === 'other' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Others
            </button>
          </div>
          {notifications.filter((n) => !n.is_read).length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orderedCategories.every((category) => category.notifications.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiInbox className="w-16 h-16 mb-4" />
            <p className="text-lg">No notifications found</p>
            <p className="text-sm">Try adjusting your search or filter settings</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {orderedCategories.map((category) => (
              <div key={category.key} className="mb-6">
                {category.notifications.length > 0 && (
                  <>
                    <h3 className="px-4 pt-4 pb-2 text-lg font-semibold text-gray-800">
                      {category.name} ({category.notifications.length})
                    </h3>
                    <div className="divide-y divide-gray-200">
                      {category.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => onNotificationClick(notification)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            notification.is_read ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3
                                  className={`text-sm font-medium ${
                                    notification.is_read ? 'text-gray-600' : 'text-gray-900 font-semibold'
                                  }`}
                                >
                                  {notification.sender_name || 'System Notification'}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(notification.created_at)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                              {notification.recipient_name && (
                                <p className="mt-1 text-xs text-gray-500">
                                  To: {notification.recipient_name}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-400">
                                {formatPHDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}