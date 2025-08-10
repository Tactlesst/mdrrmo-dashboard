import pool from '@/lib/db'; // PostgreSQL connection

export default async function handler(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
         id,
         email,
         ip_address,
         user_agent,
         -- Convert from UTC to Manila and format nicely
         TO_CHAR(
           login_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila',
           'Mon DD, YYYY, HH12:MI AM'
         ) AS login_time
       FROM login_logs
       ORDER BY login_time DESC`
    );

    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ message: 'Failed to load logs' });
  }
}
