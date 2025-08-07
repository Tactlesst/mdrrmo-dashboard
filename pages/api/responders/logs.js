import pool from '@/lib/db';
import { format } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        r.name,
        s.status,
        s.last_active_at AS timestamp
      FROM responder_sessions s
      JOIN responders r ON r.id = s.responder_id
      ORDER BY s.last_active_at DESC
      LIMIT 100
    `);

    const logs = result.rows.map(log => ({
      name: log.name,
      action: `Status changed to "${log.status}"`,
      timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    }));

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching responder logs:', error);
    res.status(500).json({ message: 'Failed to fetch responder logs' });
  }
}
