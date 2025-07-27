// pages/api/login-logs.js
import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM login_logs ORDER BY login_time DESC');
    

    
    await client.end();
    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    await client.end();
    res.status(500).json({ message: 'Failed to load logs' });
  }
}

