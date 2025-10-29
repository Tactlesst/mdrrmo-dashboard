// lib/dbQuery.js - Database query wrapper with retry logic
import pool from './db';

/**
 * Execute a database query with automatic retry on connection errors
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Query result
 */
export async function executeQuery(query, params = [], maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(query, params);
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable (connection issues)
      const isRetryable = 
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'EPIPE' ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('Connection lost');
      
      // If not retryable or last attempt, throw error
      if (!isRetryable || attempt === maxRetries) {
        console.error(`Database query failed after ${attempt + 1} attempts:`, {
          code: error.code,
          message: error.message,
          query: query.substring(0, 100) // Log first 100 chars of query
        });
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.warn(`Database connection error, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Execute a transaction with automatic retry on connection errors
 * @param {Function} callback - Async function that receives a client
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<any>} Transaction result
 */
export async function executeTransaction(callback, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = 
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'EPIPE';
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`Transaction failed after ${attempt + 1} attempts:`, error.message);
        throw error;
      }
      
      // Wait before retrying
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.warn(`Transaction error, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } finally {
      client.release();
    }
  }
  
  throw lastError;
}

/**
 * Check database connection health
 * @returns {Promise<boolean>} True if connection is healthy
 */
export async function checkConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    return false;
  }
}

export default { executeQuery, executeTransaction, checkConnection };
