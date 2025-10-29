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
        rs.estimated_arrival,
        rs.status,
        rs.started_at,
        a.lat as alert_latitude,
        a.lng as alert_longitude,
        a.address as alert_address,
        a.type as alert_type
      FROM responder_sessions rs
      JOIN responders r ON rs.responder_id = r.id
      LEFT JOIN alerts a ON rs.assigned_alert_id = a.id
      WHERE rs.is_active = true
        AND (rs.ended_at IS NULL OR rs.ended_at > NOW())
        AND rs.location_updated_at > NOW() - INTERVAL '15 minutes'
    `;

    const params = [];

    if (alertId) {
      query += ` AND rs.assigned_alert_id = $1`;
      params.push(alertId);
    }

    query += ` ORDER BY rs.location_updated_at DESC`;

    const result = await pool.query(query, params);

    const responders = result.rows.map((row) => {
      // Calculate distance and ETA if responder has assignment
      let distance = null;
      let distanceFormatted = null;
      let eta = null;
      
      if (row.assigned_alert_id && row.current_latitude && row.current_longitude && row.alert_latitude && row.alert_longitude) {
        // Haversine formula for distance
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (parseFloat(row.current_latitude) * Math.PI) / 180;
        const φ2 = (parseFloat(row.alert_latitude) * Math.PI) / 180;
        const Δφ = ((parseFloat(row.alert_latitude) - parseFloat(row.current_latitude)) * Math.PI) / 180;
        const Δλ = ((parseFloat(row.alert_longitude) - parseFloat(row.current_longitude)) * Math.PI) / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        distance = R * c; // Distance in meters
        
        // Format distance
        if (distance < 1000) {
          distanceFormatted = `${Math.round(distance)}m`;
        } else {
          distanceFormatted = `${(distance / 1000).toFixed(1)}km`;
        }
        
        // Calculate ETA (using speed or default 40 km/h)
        const speedKmh = row.speed ? parseFloat(row.speed) * 3.6 : 40;
        const distanceKm = distance / 1000;
        const timeHours = distanceKm / speedKmh;
        eta = Math.ceil(timeHours * 60); // ETA in minutes
      }
      
      return {
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
          distance: distanceFormatted,
          eta: eta,
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
        estimatedArrival: row.estimated_arrival,
        status: row.status,
        startedAt: row.started_at,
      };
    });

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
