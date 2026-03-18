// lib/db.js
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

const isLocalConnectionString = (value) => {
  if (!value) return true;
  return (
    value.includes('localhost') ||
    value.includes('127.0.0.1') ||
    value.includes('0.0.0.0')
  );
};

const shouldUseSsl = Boolean(connectionString) && !isLocalConnectionString(connectionString);

let sslConfig = false;
if (shouldUseSsl) {
  const caPath = path.join(process.cwd(), 'lib', 'certs', 'ca.pem');
  try {
    fs.accessSync(caPath, fs.constants.R_OK);
    sslConfig = {
      ca: fs.readFileSync(caPath).toString(),
      rejectUnauthorized: true
    };
  } catch (err) {
    // If CA file is missing, fall back to default SSL behavior.
    sslConfig = { rejectUnauthorized: false };
  }
}

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Optimized for serverless with many users
  max: 3, // Increased to handle concurrent requests
  min: 0, // No persistent connections (serverless shuts down)
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds (increased)
  connectionTimeoutMillis: 30000, // 30 second timeout (increased from 20s)
  query_timeout: 30000, // 30 second query timeout (increased from 15s)
  statement_timeout: 30000, // 30 second statement timeout (increased from 15s)
  allowExitOnIdle: true, // Critical for serverless - allow pool to shut down
  // Connection stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors gracefully
pool.on('error', (err, client) => {
  // Suppress common connection reset errors
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.debug('Connection reset (normal for idle connections)');
  } else {
    console.error('Unexpected pool error:', err);
  }
});

// Handle connection events
pool.on('connect', (client) => {
  client.on('error', (err) => {
    // Suppress connection reset errors
    if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
      console.debug('Client connection reset');
    } else {
      console.error('Client error:', err);
    }
  });
});

// Enhanced query function with timeout handling
export const queryWithTimeout = async (text, params, timeoutMs = 25000) => {
  const client = await pool.connect();
  
  try {
    // Set a shorter statement timeout for this specific query
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    // Handle specific timeout errors
    if (error.message.includes('timeout') || error.message.includes('Query read timeout')) {
      console.warn('Query timeout occurred, but continuing gracefully');
      throw new Error('Query timeout - please try again');
    }
    throw error;
  } finally {
    // Reset statement timeout and release client
    try {
      await client.query('SET statement_timeout = 30000');
    } catch (resetError) {
      console.warn('Could not reset statement timeout:', resetError.message);
    }
    client.release();
  }
};

export default pool;