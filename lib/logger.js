// lib/logger.js - Secure logging utility
// Only logs in development, silent in production

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Secure logger that respects environment
 */
export const logger = {
  /**
   * Log general information (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log errors (always logged, but sanitized in production)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, log only generic error without sensitive details
      console.error('[ERROR] An error occurred. Check server logs for details.');
    }
  },

  /**
   * Log debug information (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log security events (only in development)
   */
  security: (event, details) => {
    if (isDevelopment) {
      console.log(`🔒 [SECURITY] ${event}:`, details);
    }
    // In production, security events are only logged to database
  },

  /**
   * Log API calls (only in development)
   */
  api: (method, endpoint, data = null) => {
    if (isDevelopment) {
      console.log(`🌐 [API] ${method} ${endpoint}`, data ? data : '');
    }
  },

  /**
   * Log database queries (only in development)
   */
  db: (query, params = null) => {
    if (isDevelopment) {
      console.log('💾 [DB]', query, params ? params : '');
    }
  },
};

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeForLog(data) {
  if (!data) return data;

  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'cookie',
    'session',
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export default logger;
