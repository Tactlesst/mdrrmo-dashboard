import pool from '@/lib/db';
import logger from '@/lib/logger';
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
        s.started_at,
        s.ended_at,
        s.location_updated_at,
        s.route_started_at,
        s.assigned_alert_id,
        a.type as alert_type,
        COALESCE(s.location_updated_at, s.started_at) AS timestamp
      FROM responder_sessions s
      JOIN responders r ON r.id = s.responder_id
      LEFT JOIN alerts a ON s.assigned_alert_id = a.id
      ORDER BY COALESCE(s.location_updated_at, s.started_at) DESC
      LIMIT 100
    `);

    const logs = result.rows.map(log => {
      let action = '';
      
      if (log.ended_at) {
        action = `Session ended - ${log.status}`;
      } else if (log.route_started_at && log.alert_type) {
        action = `En route to ${log.alert_type} incident`;
      } else if (log.assigned_alert_id) {
        action = `Assigned to alert - ${log.status}`;
      } else {
        action = `Status: ${log.status}`;
      }
      
      return {
        name: log.name,
        action: action,
        timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      };
    });

    res.status(200).json(logs);
  } catch (error) {
    logger.error('Error fetching responder logs:', error.message);
    res.status(500).json({ message: 'Failed to fetch responder logs' });
  }
}
