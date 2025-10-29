// lib/db.js
import { Pool } from 'pg';

// Get SSL configuration - Accept self-signed certificates
function getSSLConfig() {
  console.log('Using SSL configuration for self-signed certificates');
  return {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };
}

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: getSSLConfig(),
  // Ultra-aggressive connection pool settings for local dev + serverless
  max: 1, // Only 1 connection (ultra-low for local dev)
  min: 0, // No minimum connections
  idleTimeoutMillis: 500, // Close idle clients after 0.5 seconds
  connectionTimeoutMillis: 2000, // Fast timeout for connection attempts
  allowExitOnIdle: true, // Allow pool to exit when idle (critical for serverless)
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Handle connection errors
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Client connection error:', err);
  });
});

export default pool;