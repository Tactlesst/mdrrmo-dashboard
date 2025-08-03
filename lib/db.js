// /lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL, // set in .env.local
});

export default pool;
