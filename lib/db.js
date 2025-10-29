// lib/db.js
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const caPath = path.join(process.cwd(), 'lib', 'certs', 'ca.pem');
console.log('CA path:', caPath); // Debug path

// Verify file exists
try {
  fs.accessSync(caPath, fs.constants.R_OK);
  console.log('CA file exists');
} catch (err) {
  console.error('CA file error:', err.message);
}

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(caPath).toString(),
    rejectUnauthorized: true
  },
  // Optimized for serverless with many users
  max: 1, // Single connection per instance (serverless spawns many instances)
  min: 0, // No persistent connections (serverless shuts down)
  idleTimeoutMillis: 2000, // Close idle connections after 2 seconds
  connectionTimeoutMillis: 10000, // 10 second timeout (allow time for connection)
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

export default pool;