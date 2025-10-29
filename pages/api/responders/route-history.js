// pages/api/responders/route-history.js
import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { responderId, sessionId, alertId, limit = 100 } = req.query;

    if (!responderId && !sessionId && !alertId) {
      return res.status(400).json({ 
        error: 'At least one of responderId, sessionId, or alertId is required' 
      });
    }

    let query = `
      SELECT 
        rlh.id,
        rlh.responder_id,
        rlh.session_id,
        rlh.latitude,
        rlh.longitude,
        rlh.heading,
        rlh.speed,
        rlh.accuracy,
        rlh.recorded_at,
        rlh.alert_id,
        r.name as responder_name
      FROM responder_location_history rlh
      JOIN responders r ON rlh.responder_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (responderId) {
      paramCount++;
      query += ` AND rlh.responder_id = $${paramCount}`;
      params.push(responderId);
    }

    if (sessionId) {
      paramCount++;
      query += ` AND rlh.session_id = $${paramCount}`;
      params.push(sessionId);
    }

    if (alertId) {
      paramCount++;
      query += ` AND rlh.alert_id = $${paramCount}`;
      params.push(alertId);
    }

    query += ` ORDER BY rlh.recorded_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    const history = result.rows.map((row) => ({
      id: row.id,
      responderId: row.responder_id,
      responderName: row.responder_name,
      sessionId: row.session_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      heading: row.heading ? parseFloat(row.heading) : null,
      speed: row.speed ? parseFloat(row.speed) : null,
      accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
      recordedAt: row.recorded_at,
      alertId: row.alert_id,
    }));

    // Reverse to get chronological order (oldest to newest)
    history.reverse();

    return res.status(200).json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    logger.error('Error fetching route history:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
