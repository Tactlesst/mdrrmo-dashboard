// pages/api/sessions/cleanup.js
import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mark admin sessions as inactive if last_active_at is older than 2 minutes
    const adminResult = await pool.query(
      `UPDATE admin_sessions 
       SET is_active = FALSE 
       WHERE last_active_at < NOW() - INTERVAL '2 minutes' 
       AND is_active = TRUE
       RETURNING id`
    );

    // Mark responder sessions as ended if location_updated_at is older than 5 minutes
    const responderResult = await pool.query(
      `UPDATE responder_sessions 
       SET ended_at = NOW(),
           status = 'offline' 
       WHERE location_updated_at < NOW() - INTERVAL '5 minutes' 
       AND ended_at IS NULL
       RETURNING id`
    );

    return res.status(200).json({
      success: true,
      message: 'Session cleanup completed',
      adminSessionsCleaned: adminResult.rowCount,
      responderSessionsCleaned: responderResult.rowCount
    });
  } catch (error) {
    logger.error('Session cleanup error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
