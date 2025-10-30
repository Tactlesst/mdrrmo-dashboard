// hooks/useHeartbeat.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook to send heartbeat pings to keep session alive
 * @param {string} userType - 'admin' or 'responder'
 * @param {number} interval - Heartbeat interval in milliseconds (default: 300000 = 5 minutes)
 */
export default function useHeartbeat(userType = 'admin', interval = 300000) {
  const lastHeartbeatRef = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    // Determine the correct heartbeat endpoint based on user type
    const endpoint = userType === 'responder' 
      ? '/api/responders/heartbeat' 
      : '/api/heartbeat';

    let isActive = true;

    // Function to send heartbeat with retry logic
    const sendHeartbeat = async (retryCount = 0) => {
      if (!isActive) return;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include', // Include cookies for JWT token
          headers: {
            'Content-Type': 'application/json',
          },
          // Add keepalive to ensure request completes even if page is closing
          keepalive: true,
        });

        if (!response.ok) {
          console.error('Heartbeat failed:', response.status);
          // Retry once if failed
          if (retryCount < 1) {
            setTimeout(() => sendHeartbeat(retryCount + 1), 2000);
          }
        } else {
          lastHeartbeatRef.current = Date.now();
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
        // Retry once if network error
        if (retryCount < 1) {
          setTimeout(() => sendHeartbeat(retryCount + 1), 2000);
        }
      }
    };

    // Check if heartbeat is needed (handles throttled intervals)
    const checkAndSendHeartbeat = () => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;

      // If enough time has passed, send heartbeat
      if (timeSinceLastHeartbeat >= interval) {
        sendHeartbeat();
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, send immediate heartbeat
        console.log('Page visible, sending heartbeat');
        sendHeartbeat();
      }
    };

    // Handle page focus
    const handleFocus = () => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      // If more than interval time passed, send heartbeat
      if (timeSinceLastHeartbeat >= interval) {
        console.log('Page focused, sending heartbeat');
        sendHeartbeat();
      }
    };

    // Send initial heartbeat after 10 second delay to allow app initialization
    const initialTimeout = setTimeout(() => {
      if (isActive) {
        sendHeartbeat();
      }
    }, 10000);

    // Set up interval for periodic heartbeats
    intervalRef.current = setInterval(sendHeartbeat, interval);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userType, interval]);
}
