// pages/api/responders/tracking.js
import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { alertId } = req.query;

    let query = `
      SELECT 
        r.id as responder_id,
        r.name as responder_name,
        r.email,
        r.contact,
        rs.id as session_id,
        rs.current_latitude,
        rs.current_longitude,
        rs.heading,
        rs.speed,
        rs.accuracy,
        rs.location_updated_at,
        rs.assigned_alert_id,
        rs.destination_latitude,
        rs.destination_longitude,
        rs.route_started_at,
        rs.status,
        rs.started_at,
        a.lat as alert_latitude,
        a.lng as alert_longitude,
        a.address as alert_address,
        a.type as alert_type
      FROM responder_sessions rs
      JOIN responders r ON rs.responder_id = r.id
      LEFT JOIN alerts a ON rs.assigned_alert_id = a.id
      WHERE rs.ended_at IS NULL
        AND rs.location_updated_at > NOW() - INTERVAL '5 minutes'
    `;

    const params = [];

    if (alertId) {
      query += ` AND rs.assigned_alert_id = $1`;
      params.push(alertId);
    }

    query += ` ORDER BY rs.location_updated_at DESC`;

    const result = await pool.query(query, params);

    const responders = result.rows.map((row) => ({
      responderId: row.responder_id,
      responderName: row.responder_name,
      email: row.email,
      contact: row.contact,
      sessionId: row.session_id,
      location: {
        latitude: parseFloat(row.current_latitude),
        longitude: parseFloat(row.current_longitude),
        heading: row.heading ? parseFloat(row.heading) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        updatedAt: row.location_updated_at,
      },
      assignment: row.assigned_alert_id ? {
        alertId: row.assigned_alert_id,
        destination: {
          latitude: parseFloat(row.destination_latitude),
          longitude: parseFloat(row.destination_longitude),
        },
        alertLocation: {
          latitude: parseFloat(row.alert_latitude),
          longitude: parseFloat(row.alert_longitude),
        },
        address: row.alert_address,
        type: row.alert_type,
        routeStartedAt: row.route_started_at,
      } : null,
      status: row.status,
      startedAt: row.started_at,
    }));

    return res.status(200).json({
      success: true,
      responders,
      count: responders.length,
    });
  } catch (error) {
    logger.error('Error fetching responder tracking data:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
