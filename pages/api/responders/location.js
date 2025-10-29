// pages/api/responders/location.js
import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.substring(7);
    
    // Verify token and get responder ID
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const responderId = decoded.id;

    const {
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
      alertId,
      destinationLatitude,
      destinationLongitude,
    } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update responder session with current location
      const updateQuery = `
        UPDATE responder_sessions 
        SET 
          current_latitude = $1,
          current_longitude = $2,
          heading = $3,
          speed = $4,
          accuracy = $5,
          location_updated_at = NOW(),
          last_active_at = NOW(),
          is_active = TRUE,
          assigned_alert_id = $6,
          destination_latitude = $7,
          destination_longitude = $8,
          route_started_at = CASE 
            WHEN assigned_alert_id IS NULL AND $6 IS NOT NULL THEN NOW()
            WHEN assigned_alert_id != $6 AND $6 IS NOT NULL THEN NOW()
            ELSE route_started_at
          END
        WHERE responder_id = $9
        RETURNING id, assigned_alert_id
      `;

      const updateResult = await client.query(updateQuery, [
        latitude,
        longitude,
        heading || null,
        speed || null,
        accuracy || null,
        alertId || null,
        destinationLatitude || null,
        destinationLongitude || null,
        responderId,
      ]);

      if (updateResult.rows.length === 0) {
        // Create session if it doesn't exist
        const createSessionQuery = `
          INSERT INTO responder_sessions (
            responder_id,
            current_latitude,
            current_longitude,
            heading,
            speed,
            accuracy,
            location_updated_at,
            assigned_alert_id,
            destination_latitude,
            destination_longitude,
            route_started_at,
            is_active,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, 
                    CASE WHEN $7 IS NOT NULL THEN NOW() ELSE NULL END,
                    TRUE, 'online')
          RETURNING id, assigned_alert_id
        `;

        const createResult = await client.query(createSessionQuery, [
          responderId,
          latitude,
          longitude,
          heading || null,
          speed || null,
          accuracy || null,
          alertId || null,
          destinationLatitude || null,
          destinationLongitude || null,
        ]);

        var sessionId = createResult.rows[0].id;
      } else {
        var sessionId = updateResult.rows[0].id;
      }

      // Insert into location history for breadcrumb trail
      const historyQuery = `
        INSERT INTO responder_location_history (
          responder_id,
          session_id,
          latitude,
          longitude,
          heading,
          speed,
          accuracy,
          alert_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await client.query(historyQuery, [
        responderId,
        sessionId,
        latitude,
        longitude,
        heading || null,
        speed || null,
        accuracy || null,
        alertId || null,
      ]);

      await client.query('COMMIT');

      logger.info(`Location updated for responder ${responderId}: (${latitude}, ${longitude})`);

      return res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: {
          responderId,
          sessionId,
          latitude,
          longitude,
          alertId,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Location update error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
