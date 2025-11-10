import pool from '@/lib/db';
import logger from '@/lib/logger';

/**
 * API endpoint for alert-specific notifications
 * Handles emergency/alert notifications separately from regular notifications
 */
export default async function handler(req, res) {
  const { method } = req;
  const { userId, accountType = 'admin', showAll = 'false', notificationId } = method === 'GET' ? req.query : req.body;

  let client;
  try {
    client = await pool.connect();
    
    // Test the connection
    try {
      await client.query('SELECT 1');
    } catch (testErr) {
      logger.warn('Connection test failed, getting fresh connection:', testErr.message);
      client.release();
      client = await pool.connect();
    }
    
    await client.query(`SET TIME ZONE 'UTC'`);

    // GET - Fetch alert notifications
    if (method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      
      if (!userId && showAll === 'false') {
        return res.status(400).json({ message: 'userId parameter is required when showAll is false' });
      }
      
      if (showAll === 'true') {
        // Get all alert notifications
        const { rows } = await client.query(
          `SELECT 
            an.id, 
            an.alert_id,
            an.message, 
            an.severity,
            an.created_at,
            an.sender_type,
            an.sender_id,
            an.account_type,
            an.account_id,
            an.is_read,
            an.is_acknowledged,
            an.acknowledged_at,
            CASE 
              WHEN an.sender_type = 'admin' THEN a.name
              WHEN an.sender_type = 'responder' THEN r.name
              ELSE 'MDRRMO Alert System'
            END as sender_name,
            CASE
              WHEN an.account_type = 'admin' THEN adm.name
              WHEN an.account_type = 'responder' THEN resp.name
              ELSE 'Unknown'
            END as recipient_name,
            al.type as alert_type,
            al.address as alert_address,
            al.status as alert_status,
            al.lat as alert_lat,
            al.lng as alert_lng
           FROM alert_notifications an
           LEFT JOIN admins a ON an.sender_type = 'admin' AND an.sender_id = a.id
           LEFT JOIN responders r ON an.sender_type = 'responder' AND an.sender_id = r.id
           LEFT JOIN admins adm ON an.account_type = 'admin' AND an.account_id = adm.id
           LEFT JOIN responders resp ON an.account_type = 'responder' AND an.account_id = resp.id
           LEFT JOIN alerts al ON an.alert_id = al.id
           ORDER BY an.created_at DESC`
        );
        return res.status(200).json({ notifications: rows });
      } else {
        // Get alert notifications for specific user
        const { rows } = await client.query(
          `SELECT 
            an.id, 
            an.alert_id,
            an.message, 
            an.severity,
            an.created_at,
            an.sender_type,
            an.sender_id,
            an.account_type,
            an.is_read,
            an.is_acknowledged,
            an.acknowledged_at,
            CASE 
              WHEN an.sender_type = 'admin' THEN a.name
              WHEN an.sender_type = 'responder' THEN r.name
              ELSE 'MDRRMO Alert System'
            END as sender_name,
            al.type as alert_type,
            al.address as alert_address,
            al.status as alert_status,
            al.lat as alert_lat,
            al.lng as alert_lng
           FROM alert_notifications an
           LEFT JOIN admins a ON an.sender_type = 'admin' AND an.sender_id = a.id
           LEFT JOIN responders r ON an.sender_type = 'responder' AND an.sender_id = r.id
           LEFT JOIN alerts al ON an.alert_id = al.id
           WHERE an.account_type = $1 AND an.account_id = $2 AND an.is_read = FALSE
           ORDER BY an.created_at DESC`,
          [accountType, userId]
        );
        return res.status(200).json({ notifications: rows });
      }
    }

    // POST - Mark single alert notification as read
    if (method === 'POST') {
      if (!notificationId) {
        return res.status(400).json({ message: 'notificationId is required' });
      }
      const id = Number(notificationId);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: `Invalid notificationId: ${notificationId}` });
      }
      
      // First, get the alert_id from this notification
      const notifCheck = await client.query(
        `SELECT alert_id FROM alert_notifications WHERE id = $1`,
        [id]
      );
      
      if (notifCheck.rowCount === 0) {
        return res.status(404).json({ message: `Alert notification not found for ID: ${id}` });
      }
      
      const alertId = notifCheck.rows[0].alert_id;
      
      // Mark ALL notifications for this alert as read (handles broadcast notifications)
      const result = await client.query(
        `UPDATE alert_notifications
         SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE alert_id = $1`,
        [alertId]
      );
      
      return res.status(200).json({ 
        message: 'Alert notification marked as read',
        notificationsUpdated: result.rowCount 
      });
    }

    // PUT - Mark all alert notifications as read
    if (method === 'PUT') {
      if (!userId && showAll === 'false') {
        return res.status(400).json({ message: 'userId parameter is required when showAll is false' });
      }
      if (showAll === 'true') {
        await client.query(
          `UPDATE alert_notifications
           SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE is_read = FALSE`
        );
      } else {
        await client.query(
          `UPDATE alert_notifications
           SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE account_type = $1 AND account_id = $2 AND is_read = FALSE`,
          [accountType, userId]
        );
      }
      return res.status(200).json({ message: 'All alert notifications marked as read' });
    }

    // PATCH - Acknowledge alert notification
    if (method === 'PATCH') {
      if (!notificationId) {
        return res.status(400).json({ message: 'notificationId is required' });
      }
      const id = Number(notificationId);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: `Invalid notificationId: ${notificationId}` });
      }
      const result = await client.query(
        `UPDATE alert_notifications
         SET is_acknowledged = TRUE, 
             acknowledged_at = CURRENT_TIMESTAMP,
             is_read = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `Alert notification not found for ID: ${id}` });
      }
      return res.status(200).json({ message: 'Alert notification acknowledged' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    logger.error('Error handling alert notifications:', err.message);
    logger.error({
      message: err.message,
      code: err.code,
      stack: err.stack,
      method: method,
      userId: userId,
      showAll: showAll
    });
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ message: 'Database connection unavailable. Please try again.' });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        logger.error('Error releasing client:', releaseErr.message);
      }
    }
  }
}
