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
  }
});

export default pool;