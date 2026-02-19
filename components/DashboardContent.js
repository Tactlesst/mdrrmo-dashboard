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
import useHeartbeat from '@/hooks/useHeartbeat';
import { FiBell, FiX, FiCheck, FiChevronDown, FiChevronUp, FiInbox, FiEye, FiEyeOff, FiSettings } from 'react-icons/fi';

const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });
const Alerts = dynamic(() => import('./Alerts'), { ssr: false });

export default function DashboardContent({ user }) {
  // Enable heartbeat for session management (sends ping every 2 minutes for accurate status)
  const wsPresenceEnabled = String(process.env.NEXT_PUBLIC_WS_PRESENCE_ENABLED || '').toLowerCase() === 'true';
  useHeartbeat('admin', 120000, !wsPresenceEnabled);
  const wsRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);
  const wsDebounceTimerRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [admin, setAdmin] = useState({ name: '', email: '', profile_image_url: '' });
  const [activeContent, setActiveContent] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [error, setError] = useState(null);
  const [headerNotifFilter, setHeaderNotifFilter] = useState('alerts');
  const [alertModal, setAlertModal] = useState(null); // { alert, notification }
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState({
    soundEnabled: true,
    autoShowModal: true,
    dismissedAlerts: new Set()
  });
  const [connectionIssues, setConnectionIssues] = useState(0);
  const audioRef = useRef(null);
  // Settings state moved into components/Settings.js
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const verifyIncidentsRefreshRef = useRef(null);

  // Initialize alert sound
  useEffect(() => {
    audioRef.current = new Audio('/alarm.mp3.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.loop = true; // Loop the alarm until acknowledged
    audioRef.current.muted = false; // Ensure audio is not muted
    
    // Enable audio on first user interaction (required by browsers)
    const enableAudio = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    };
    document.addEventListener('click', enableAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  // Format date for relative time in Asia/Manila timezone
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
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
        // For older dates, show formatted date
        const options = { 
          timeZone: 'Asia/Manila', 
          month: 'short', 
          day: 'numeric',
          year: diffDays > 365 ? 'numeric' : undefined
        };
        return date.toLocaleString('en-PH', options);
      }
    } catch (error) {
      console.error(`Error formatting relative time ${dateString}:`, error);
      return 'N/A';
    }
  };

  // WebSocket: trigger an immediate refresh when the WS server broadcasts a new notification
  useEffect(() => {
    const httpBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    if (!httpBase) {
      return;
    }

    const wsBase = httpBase
      .replace(/^https:\/\//i)
      .replace(/^http:\/\//i)
      .replace(/\/$/, '');

    const connect = () => {
      try {
        if (wsReconnectTimerRef.current) {
          clearTimeout(wsReconnectTimerRef.current);
          wsReconnectTimerRef.current = null;
        }

        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch {
            // ignore
          }
          wsRef.current = null;
        }

        const url = `${wsBase}/ws/notifications?channel=all`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          fetchNotifications();
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg?.type === 'notification') {
              if (wsDebounceTimerRef.current) clearTimeout(wsDebounceTimerRef.current);
              wsDebounceTimerRef.current = setTimeout(() => {
                fetchNotifications();
              }, 250);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          wsReconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          try {
            ws.close();
          } catch {
            // ignore
          }
        };
      } catch {
        setWsConnected(false);
        wsReconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      setWsConnected(false);
      if (wsDebounceTimerRef.current) clearTimeout(wsDebounceTimerRef.current);
      if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  // Fetch notifications with retry logic and cooldown - fetches BOTH regular and alert notifications
  const fetchNotifications = async (retryCount = 0, isRetry = false) => {
    try {
      // Add cooldown delay if this is a retry to prevent overwhelming the server
      if (isRetry && retryCount > 0) {
        const cooldownDelay = Math.min(5000 * retryCount, 30000); // 5s, 10s, 15s, max 30s
        console.log(`Applying cooldown delay: ${cooldownDelay}ms before retry ${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, cooldownDelay));
      }

      // Fetch regular notifications (chat, admin, system)
      const regularUrl = `/api/notifications?showAll=true`;
      const alertUrl = `/api/notifications/alerts?showAll=true`;

      // Create abort controller for better timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort('timeout');
        } catch {
          // ignore
        }
      }, 15000); // 15 second timeout
      
      try {
        const [regularRes, alertRes] = await Promise.all([
          fetch(regularUrl, { 
            signal: controller.signal,

            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }),
          fetch(alertUrl, { 
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        ]);

        clearTimeout(timeoutId);

        if (!regularRes.ok) {
          if ((regularRes.status === 500 || regularRes.status === 503 || regularRes.status === 408) && retryCount < 2) {
            console.warn(`Regular notifications fetch failed with ${regularRes.status}, retrying in cooldown... (attempt ${retryCount + 1}/2)`);
            setTimeout(() => fetchNotifications(retryCount + 1, true), 1000);
            return;
          }
          throw new Error(`Failed to fetch regular notifications: ${regularRes.status}`);
        }
        
        if (!alertRes.ok) {
          if ((alertRes.status === 500 || alertRes.status === 503 || alertRes.status === 408) && retryCount < 2) {
            console.warn(`Alert notifications fetch failed with ${alertRes.status}, retrying in cooldown... (attempt ${retryCount + 1}/2)`);
            setTimeout(() => fetchNotifications(retryCount + 1, true), 1000);
            return;
          }
          console.warn(`Alert notifications fetch failed with ${alertRes.status}, continuing with regular notifications only`);
        }
        
        const regularData = await regularRes.json();
        const alertData = alertRes.ok ? await alertRes.json() : { notifications: [] };
        
        // Combine both types of notifications
        const allNotifications = [
          ...(regularData?.notifications || []),
          ...(alertData?.notifications || [])
        ];
        
        if (allNotifications.length > 0) {
          const validNotifications = allNotifications.filter(n => n.id && Number.isInteger(Number(n.id)));
          if (validNotifications.length < allNotifications.length) {
            console.warn('Some notifications had invalid IDs and were filtered out');
          }
          
          // Filter: System, Alerts, Admin, and Chat = global, Others = current user only
          const filtered = validNotifications.filter(n => {
            const type = (n.sender_type || '').toLowerCase();
            if (type === 'system' || type === 'responder' || type === 'alerts1' || type === 'admin' || type === 'chat') {
              return true; // Show all system, alerts, admin, and chat notifications globally
            }
            // For others: show only if they belong to current user
            return n.account_id === user.id;
          });
          
          // Sort by created_at (newest first)
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setNotifications(filtered);
          
          // Check for new emergency alert notifications (exclude tracking/success messages)
          const unreadAlerts = filtered.filter(n => 
            !n.is_read && 
            (n.sender_type === 'responder' || n.sender_type === 'alerts1') &&
            !n.message.includes('verified and dispatcher going soon') && // Exclude tracking notifications
            !n.message.includes('verified and dispatched') && // Exclude old tracking notifications
            !n.message.includes('✅') // Exclude success/tracking messages
          );
          
          // If unread alerts decreased, someone picked up an alert - stop the alarm and close modal
          if (unreadAlerts.length < lastNotificationCount && audioRef.current) {
            console.log('🔇 Alert picked up - stopping alarm');
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Close modal if the current alert was marked as read
            if (alertModal && alertModal.notification) {
              const currentAlertStillUnread = unreadAlerts.find(a => a.id === alertModal.notification.id);
              if (!currentAlertStillUnread) {
                console.log('🔇 Current alert was marked as read - closing modal');
                setAlertModal(null);
              }
            }
          }
          
          // If new alert received, play sound and show modal
          if (unreadAlerts.length > lastNotificationCount && lastNotificationCount > 0) {
            const latestAlert = unreadAlerts[0];
            
            // Only play sound if enabled and alert not dismissed
            if (notificationSettings.soundEnabled && audioRef.current && !notificationSettings.dismissedAlerts.has(latestAlert.id)) {
              audioRef.current.play().catch(err => console.error('Audio play failed:', err));
            }
            
            // Only show modal if auto-show is enabled and alert not dismissed
            if (notificationSettings.autoShowModal && !notificationSettings.dismissedAlerts.has(latestAlert.id)) {
              setAlertModal({ notification: latestAlert });
            }
          }
          
          // If no more unread alerts, stop the alarm and close modal
          if (unreadAlerts.length === 0) {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            if (alertModal) {
              console.log('🔇 No more unread alerts - closing modal');
              setAlertModal(null);
            }
          }
          
          setLastNotificationCount(unreadAlerts.length);
          // Clear error on successful fetch and reset connection issues
          setError(null);
          setConnectionIssues(0);
        } else {
          setNotifications([]);
        }
      } catch (fetchError) {
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);

      // Handle timeout and abort errors with retry logic
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError' || String(err?.message || '').includes('timeout') || String(err?.message || '').includes('aborted')) {
        if (retryCount < 2) {
          console.warn(`Query timeout detected, retrying in cooldown... (attempt ${retryCount + 1}/2)`);
          setTimeout(() => fetchNotifications(retryCount + 1, true), 2000);
          return;
        }

        console.error('Max retries reached for timeout, skipping this fetch cycle');
        setConnectionIssues(prev => prev + 1);
        setError('Connection timeout. Notifications may be delayed. Check your internet connection.');
        return;
      }

      if (retryCount >= 2) {
        setError(`Error: ${err.message}`);
      }
    }
  };

  // Play alarm sound only when modal is showing and sound is enabled
  useEffect(() => {
    if (alertModal && audioRef.current && notificationSettings.soundEnabled) {
      console.log('🔊 Attempting to play emergency alarm...');
      audioRef.current.currentTime = 0;
      audioRef.current.muted = false; // Ensure not muted
      audioRef.current.volume = 0.7; // Ensure volume is set
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Emergency alarm playing successfully');
          })
          .catch(err => {
            console.error('❌ Audio play failed:', err);
            console.log('Trying to play with user interaction...');
            // Try to play on next user interaction
            const playOnClick = () => {
              if (audioRef.current && alertModal && notificationSettings.soundEnabled) {
                audioRef.current.play()
                  .then(() => console.log('✅ Alarm playing after user interaction'))
                  .catch(e => console.error('Still failed:', e));
              }
              document.removeEventListener('click', playOnClick);
            };
            document.addEventListener('click', playOnClick, { once: true });
          });
      }
    } else if ((!alertModal || !notificationSettings.soundEnabled) && audioRef.current) {
      // Stop sound when modal is closed or sound is disabled
      console.log('🔇 Stopping emergency alarm');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [alertModal, notificationSettings.soundEnabled]);

  // Settings are handled inside <Settings />

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setError(null);
      const id = Number(notificationId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid notification ID: Must be a positive number');
      }
      
      // Find the notification to determine which API to use
      const notification = notifications.find(n => n.id === id);
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Use different API endpoint based on notification type
      const isAlertNotification = notification.sender_type === 'responder' || notification.sender_type === 'alerts1';
      const apiEndpoint = isAlertNotification ? '/api/notifications/alerts' : '/api/notifications';
      
      console.log('Marking notification as read:', { 
        notificationId: id, 
        type: notification.sender_type,
        endpoint: apiEndpoint 
      });
      
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to mark notification as read: ${res.status} ${res.statusText} - ${errorData.message || 'No additional details'}`);
      }
      
      // Refresh notifications to get updated state (handles broadcast notifications)
      await fetchNotifications();
      
      // Trigger VerifyIncidents refresh if this is an alert notification
      if (isAlertNotification) {
        console.log('🔄 Triggering VerifyIncidents refresh after alert marked as read');
        if (verifyIncidentsRefreshRef.current) {
          verifyIncidentsRefreshRef.current();
        }
      }
      
      // Close alert modal if this is the notification being displayed
      if (alertModal && alertModal.notification && alertModal.notification.id === id) {
        console.log('🔇 Closing alert modal - notification marked as read');
        setAlertModal(null);
      }
      
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
      
      // Mark regular notifications as read
      const regularRes = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, showAll: 'true' }),
      });
      
      if (!regularRes.ok) {
        throw new Error(`Failed to mark regular notifications as read: ${regularRes.status}`);
      }
      
      // Mark alert notifications as read
      const alertRes = await fetch('/api/notifications/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, showAll: 'true' }),
      });
      
      if (!alertRes.ok) {
        console.warn('Failed to mark alert notifications as read:', alertRes.status);
      }
      
      // Refresh notifications to get updated state
      await fetchNotifications();
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
    
    // Show notification details for all types (including alerts)
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

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with redirect even if API call fails
    } finally {
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    )},
    { id: 'alerts', name: 'Mancon UI', icon: (
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
    <div className="h-screen bg-blue-50 font-sans flex flex-col overflow-hidden">
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
      
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg px-6 py-4 flex items-center justify-between rounded-b-md flex-none">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative w-14 h-14 hidden sm:block">
            <Image src="/Logoo.png" alt="MDRRMO" fill sizes="56px" className="object-contain" priority />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MDRRMO Accident Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status Indicator */}
          {connectionIssues > 0 && (
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Connection Issues</span>
            </div>
          )}
          
          {/* Notification Settings Toggle */}
          <div className="relative">
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`p-2 rounded-lg transition-colors ${notificationSettings.soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
              title={`Sound ${notificationSettings.soundEnabled ? 'ON' : 'OFF'}`}
            >
              {notificationSettings.soundEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H2v-6h3.586l5.707-5.707A1 1 0 0113 4v16a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative focus:outline-none"
            >
              <FiBell className="w-6 h-6 text-white" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[22rem] md:w-[28rem] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">
                    My Notifications
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
                        onClick={() => setHeaderNotifFilter('chat')}
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${headerNotifFilter === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => setHeaderNotifFilter('admin')}
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${headerNotifFilter === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Admin
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
                  const isAlert = (n) => n.sender_type === 'responder' || n.sender_type === 'alerts1';
                  const isChat = (n) => n.sender_type === 'chat';
                  const isAdminCat = (n) => n.sender_type === 'admin';
                  const isSystem = (n) => n.sender_type === 'system';
                  const inFilter = (n) => {
                    if (headerNotifFilter === 'alerts') return isAlert(n);
                    if (headerNotifFilter === 'chat') return isChat(n);
                    if (headerNotifFilter === 'admin') return isAdminCat(n);
                    if (headerNotifFilter === 'system') return isSystem(n);
                    if (headerNotifFilter === 'other') return !isAlert(n) && !isChat(n) && !isAdminCat(n) && !isSystem(n);
                    return true;
                  };
                  // Show only unread notifications in dropdown
                  const list = notifications.filter(n => !n.is_read && inFilter(n)).slice(0, 10);
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
                <div className="p-3 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Alert Settings:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, autoShowModal: !prev.autoShowModal }))}
                        className={`px-2 py-1 rounded text-xs ${notificationSettings.autoShowModal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {notificationSettings.autoShowModal ? 'Auto-show ON' : 'Auto-show OFF'}
                      </button>
                      <button
                        onClick={() => {
                          // Clear all dismissed alerts
                          setNotificationSettings(prev => ({
                            ...prev,
                            dismissedAlerts: new Set()
                          }));
                        }}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                      >
                        Reset Dismissed
                      </button>
                    </div>
                  </div>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <span className="text-sm font-bold">i</span>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Notification Details</h3>
                  <p className="text-[11px] text-gray-500">{formatRelativeTime(selectedNotification.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedNotification.sender_type === 'responder' || selectedNotification.sender_type === 'alerts1' ? 'bg-red-100 text-red-700' : selectedNotification.sender_type === 'chat' ? 'bg-purple-100 text-purple-700' : selectedNotification.sender_type === 'admin' ? 'bg-blue-100 text-blue-700' : selectedNotification.sender_type === 'system' ? 'bg-gray-100 text-gray-700' : 'bg-slate-100 text-slate-700'}`}>
                  {selectedNotification.sender_type === 'responder' || selectedNotification.sender_type === 'alerts1' ? 'Alerts' : selectedNotification.sender_type === 'chat' ? 'Chat' : selectedNotification.sender_type === 'admin' ? 'Admin' : selectedNotification.sender_type === 'system' ? 'System' : 'Others'}
                </span>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500">From</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedNotification.sender_name || 'System'}</p>
                </div>

                <div className="sm:col-span-2 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs font-medium text-gray-500">Message</p>
                  <p className="mt-2 text-sm text-gray-800 leading-relaxed">{selectedNotification.message}</p>
                </div>

                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500">Date & Time</p>
                  <p className="mt-1 text-sm text-gray-900">{formatRelativeTime(selectedNotification.created_at)}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500">Type</p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedNotification.account_type}</p>
                </div>
                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <p className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedNotification.is_read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedNotification.is_read ? 'Read' : 'Unread'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                {(selectedNotification.sender_type === 'responder' || selectedNotification.sender_type === 'alerts1') && (
                  <button
                    onClick={() => {
                      setActiveContent('alerts');
                      handleCloseDetails();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>View on Map</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!selectedNotification.is_read && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id);
                      handleCloseDetails();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FiCheck className="w-4 h-4" />
                    <span>Mark as Read & Close</span>
                  </button>
                )}
                <button
                  onClick={handleCloseDetails}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col md:flex-row p-4 gap-4 overflow-hidden overflow-x-hidden">
        <aside
          ref={sidebarRef}
          onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
          className={`bg-white text-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-20 items-center' : 'w-full md:w-64'}
            ${isSidebarCollapsed && 'fixed top-[90px] left-4 z-30 md:static'} md:relative`}
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
          <main className="flex-1 min-h-0 bg-white rounded-xl shadow-md p-6 overflow-auto">
            {activeContent === 'dashboard' && <MapDisplay />}
            {activeContent === 'alerts' && <Alerts verifyIncidentsRefreshRef={verifyIncidentsRefreshRef} />}
            {activeContent === 'inbox' && (
              <Inbox 
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllAsRead}
                onRefresh={fetchNotifications}
                onNotificationClick={handleNotificationClick}
              />
            )}
            {activeContent === 'users' && <Users />}
            {activeContent === 'online-admins' && (
              <OnlineAdminsList 
                currentUserId={user?.id}
                currentUserName={admin?.name || user?.email}
                currentUserType="admin"
              />
            )}
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

      {alertModal && (
        <div className="fixed bottom-4 right-4 z-[70] w-80 animate-slideIn">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-red-500 overflow-hidden animate-shake">
            <style jsx>{`
              @keyframes slideIn {
                from { 
                  transform: translateX(400px);
                  opacity: 0;
                }
                to { 
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                20%, 40%, 60%, 80% { transform: translateX(3px); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes glow {
                0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
                50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.7); }
              }
              .animate-slideIn {
                animation: slideIn 0.4s ease-out;
              }
              .animate-shake {
                animation: shake 0.5s ease-in-out, glow 2s ease-in-out infinite;
              }
              .animate-pulse-alert {
                animation: pulse 1.5s ease-in-out infinite;
              }
            `}</style>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-2.5 py-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse-alert opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-pulse-alert">
                    <span className="text-sm">🚨</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">Emergency Alert!</h3>
                    <p className="text-[10px] text-red-100">
                      {alertModal.remainingCount > 0 
                        ? `${alertModal.remainingCount + 1} unread`
                        : 'Attention required'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full">
                    <span className="text-xs animate-pulse-alert">🔊</span>
                  </div>
                  <button 
                    onClick={() => {
                      // Dismiss this specific alert
                      setNotificationSettings(prev => ({
                        ...prev,
                        dismissedAlerts: new Set([...prev.dismissedAlerts, alertModal.notification.id])
                      }));
                      setAlertModal(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors text-xs px-2 py-1 bg-white/20 rounded"
                    title="Dismiss this alert"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => { setAlertModal(null); handleMarkAsRead(alertModal.notification.id); }}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Close"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-2.5 max-h-[300px] overflow-y-auto">
              <div className="bg-red-50 border-l-2 border-red-600 p-2 mb-2 rounded">
                <p className="text-xs font-medium text-red-900 line-clamp-2">{alertModal.notification.message}</p>
                <p className="text-[10px] text-red-700 mt-0.5">From: {alertModal.notification.sender_name || 'Unknown'}</p>
                <p className="text-[10px] text-red-600 mt-0.5">{formatRelativeTime(alertModal.notification.created_at)}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-1.5">
                <button 
                  onClick={() => { setActiveContent('alerts'); setAlertModal(null); handleMarkAsRead(alertModal.notification.id); }} 
                  className="w-full px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs shadow animate-pulse-alert"
                >
                  <span className="text-sm">⚠️</span> VIEW ALERT
                </button>
                
                {alertModal.remainingCount > 0 && (
                  <button 
                    onClick={() => { 
                      handleMarkAsRead(alertModal.notification.id);
                      const nextAlerts = alertModal.allUnreadAlerts.slice(1);
                      if (nextAlerts.length > 0) {
                        setAlertModal({
                          notification: nextAlerts[0],
                          remainingCount: nextAlerts.length - 1,
                          allUnreadAlerts: nextAlerts
                        });
                      } else {
                        setAlertModal(null);
                      }
                    }} 
                    className="w-full px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 font-medium text-xs shadow"
                  >
                    <span>➡️</span> NEXT ({alertModal.remainingCount})
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => { setActiveContent('alerts'); setAlertModal(null); handleMarkAsRead(alertModal.notification.id); }} 
                    className="px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-0.5 text-[10px] font-medium"
                  >
                    <span>📍</span> Map
                  </button>
                  <button 
                    onClick={() => { setActiveContent('online-admins'); setAlertModal(null); handleMarkAsRead(alertModal.notification.id); }} 
                    className="px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-0.5 text-[10px] font-medium"
                  >
                    <span>💬</span> Notify
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => { setAlertModal(null); handleMarkAsRead(alertModal.notification.id); }} 
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-[10px] font-medium"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      // Dismiss all current unread alerts
                      const unreadAlerts = notifications.filter(n => 
                        !n.is_read && 
                        (n.sender_type === 'responder' || n.sender_type === 'alerts1') &&
                        !n.message.includes('verified and dispatcher going soon') &&
                        !n.message.includes('verified and dispatched') &&
                        !n.message.includes('✅')
                      );
                      const alertIds = unreadAlerts.map(a => a.id);
                      setNotificationSettings(prev => ({
                        ...prev,
                        dismissedAlerts: new Set([...prev.dismissedAlerts, ...alertIds])
                      }));
                      setAlertModal(null);
                    }} 
                    className="px-3 py-1.5 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 transition-colors text-[10px] font-medium"
                  >
                    Dismiss All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}