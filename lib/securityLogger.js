// lib/securityLogger.js - Security event logging utility
import pool from './db';
import logger from './logger';

/**
 * Log security events to the security_logs table
 * @param {Object} params - Security event parameters
 * @param {string} params.eventType - Type of event (login_success, login_failed, user_created, etc.)
 * @param {string} params.email - User email (if applicable)
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {string} params.details - Additional event details
 * @param {string} params.severity - Event severity (low, medium, high, critical)
 */
export async function logSecurityEvent({
  eventType,
  email = null,
  ipAddress = null,
  userAgent = null,
  details = null,
  severity = 'medium'
}) {
  try {
    await pool.query(
      `INSERT INTO security_logs (event_type, email, ip_address, user_agent, details, severity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE 'Asia/Manila')`,
      [eventType, email, ipAddress, userAgent, details, severity]
    );
    // Only log in development mode
    logger.security(eventType, { email: email || 'N/A', severity });
  } catch (error) {
    // Don't throw error - logging should not break the application
    logger.error('Failed to log security event:', error.message);
  }
}

/**
 * Helper function to extract IP address from request
 * @param {Object} req - Next.js request object
 * @returns {string} IP address
 */
export function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip || 'Unknown';
}

/**
 * Security event types
 */
export const SecurityEventTypes = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  
  // User management events
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  
  // Access control events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PERMISSION_DENIED: 'permission_denied',
  
  // Data events
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  DATA_EXPORT: 'data_export',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  
  // Validation events
  VALIDATION_FAILED: 'validation_failed',
  DUPLICATE_EMAIL: 'duplicate_email',
};

/**
 * Severity levels
 */
export const SeverityLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};
