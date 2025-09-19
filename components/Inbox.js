'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff, FiSearch, FiRefreshCw, FiInbox } from 'react-icons/fi';

export default function Inbox({
  notifications,
  viewAllNotifications,
  onToggleViewAll,
  onMarkAllAsRead,
  onRefresh,
  onNotificationClick,
  isLoading,
}) {
  const [inboxFilter, setInboxFilter] = useState('all');
  const [inboxSearch, setInboxSearch] = useState('');

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

  // Format date for relative time in Asia/Manila timezone
  const formatRelativeTime = (dateString) => {
    if (!dateString) {
      console.warn('No dateString provided for formatRelativeTime');
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return 'N/A';
      }

      // Convert to Asia/Manila
      const dateManila = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const now = new Date();
      const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

      const diffMs = nowManila - dateManila;
      const diffMins = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Detailed debug logging
      console.log({
        input: dateString,
        parsedDate: date.toISOString(),
        dateManila: dateManila.toISOString(),
        now: now.toISOString(),
        nowManila: nowManila.toISOString(),
        diffMs,
        diffMins,
        diffHours,
        diffDays,
      });

      if (diffMs < 0) {
        console.warn(`Future timestamp detected: ${dateString}, diff: ${diffMins} mins`);
        return 'just now';
      } else if (diffMins < 1) {
        return 'just now';
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

    const matchesFilter =
      inboxFilter === 'all' ||
      (inboxFilter === 'unread' && !notification.is_read) ||
      (inboxFilter === 'read' && notification.is_read);

    if (matchesSearch && matchesFilter) {
      if (['admin', 'responder'].includes(notification.sender_type)) {
        categorizedNotifications.alerts.push(notification);
      } else if (notification.sender_type === 'system') {
        categorizedNotifications.system.push(notification);
      } else {
        categorizedNotifications.other.push(notification);
      }
    }
  });

  // Sort notifications within each category by created_at (descending)
  const orderedCategories = [
    { name: 'Alerts', key: 'alerts', notifications: categorizedNotifications.alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) },
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
          <select
            value={inboxFilter}
            onChange={(e) => setInboxFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
          <button
            onClick={onToggleViewAll}
            className="flex items-center text-blue-600 hover:text-blue-800"
            title={viewAllNotifications ? 'View only my notifications' : 'View all notifications'}
          >
            {viewAllNotifications ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            <span className="ml-1 hidden md:inline">
              {viewAllNotifications ? 'My View' : 'Admin View'}
            </span>
          </button>
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
            <p className="text-sm">
              {inboxSearch || inboxFilter !== 'all'
                ? 'Try adjusting your search or filter settings'
                : 'All caught up! No new notifications'}
            </p>
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