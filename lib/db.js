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
  // Connection pool settings to prevent timeout errors
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  maxUses: 7500, // Close connections after 7500 uses to prevent memory leaks
  allowExitOnIdle: false, // Keep pool alive even when all clients are idle
});

export default pool;