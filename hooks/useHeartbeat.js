// hooks/useHeartbeat.js
import { useEffect } from 'react';

/**
 * Custom hook to send heartbeat pings to keep session alive
 * @param {string} userType - 'admin' or 'responder'
 * @param {number} interval - Heartbeat interval in milliseconds (default: 30000 = 30 seconds)
 */
export default function useHeartbeat(userType = 'admin', interval = 30000) {
  useEffect(() => {
    // Determine the correct heartbeat endpoint based on user type
    const endpoint = userType === 'responder' 
      ? '/api/responders/heartbeat' 
      : '/api/heartbeat';

    // Function to send heartbeat
    const sendHeartbeat = async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include', // Include cookies for JWT token
        });

        if (!response.ok) {
          console.error('Heartbeat failed:', response.status);
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    const heartbeatInterval = setInterval(sendHeartbeat, interval);

    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [userType, interval]);
}
