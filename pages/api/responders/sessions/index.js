import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        rs.id,
        rs.responder_id,
        rs.status,
        rs.location_updated_at,
        r.name,
        CASE WHEN rs.ended_at IS NULL THEN TRUE ELSE FALSE END as is_active
      FROM responder_sessions rs
      JOIN responders r ON rs.responder_id = r.id
      WHERE rs.ended_at IS NULL
        AND rs.location_updated_at > NOW() - INTERVAL '5 minutes'
      ORDER BY rs.location_updated_at DESC
    `);

    const sessions = result.rows.map((row) => ({
      id: row.id,
      responder_id: row.responder_id,
      name: row.name,
      status: row.status,
      is_active: row.is_active,
      last_active_at: row.location_updated_at,
    }));

    res.status(200).json({ sessions });
  } catch (error) {
    logger.error('Error fetching responder sessions:', error.message);
    res.status(500).json({ message: 'Failed to fetch responder sessions' });
  }
}