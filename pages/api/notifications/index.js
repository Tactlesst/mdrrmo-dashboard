import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { userId, accountType = 'admin', showAll = 'false' } = method === 'GET' ? req.query : req.body;

  if (!userId && showAll === 'false') {
    return res.status(400).json({ message: 'userId parameter is required when showAll is false' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query(`SET TIME ZONE 'Asia/Manila'`);

    if (method === 'GET') {
      if (showAll === 'true') {
        // Fetch all notifications for admin view
        const { rows } = await client.query(
          `SELECT 
            n.id, 
            n.message, 
            n.created_at,
            n.sender_type,
            n.sender_id,
            n.account_type,
            n.account_id,
            n.is_read,
            CASE 
              WHEN n.sender_type = 'admin' THEN a.name
              WHEN n.sender_type = 'responder' THEN r.name
              ELSE 'System'
            END as sender_name,
            CASE
              WHEN n.account_type = 'admin' THEN adm.name
              WHEN n.account_type = 'responder' THEN resp.name
              ELSE 'Unknown'
            END as recipient_name
           FROM notifications n
           LEFT JOIN admins a ON n.sender_type = 'admin' AND n.sender_id = a.id
           LEFT JOIN responders r ON n.sender_type = 'responder' AND n.sender_id = r.id
           LEFT JOIN admins adm ON n.account_type = 'admin' AND n.account_id = adm.id
           LEFT JOIN responders resp ON n.account_type = 'responder' AND n.account_id = resp.id
           ORDER BY n.created_at DESC`,
        );
        
        return res.status(200).json({ notifications: rows });
      } else {
        // Fetch notifications for specific user
        const { rows } = await client.query(
          `SELECT 
            n.id, 
            n.message, 
            n.created_at,
            n.sender_type,
            n.sender_id,
            n.account_type,
            CASE 
              WHEN n.sender_type = 'admin' THEN a.name
              WHEN n.sender_type = 'responder' THEN r.name
              ELSE 'System'
            END as sender_name
           FROM notifications n
           LEFT JOIN admins a ON n.sender_type = 'admin' AND n.sender_id = a.id
           LEFT JOIN responders r ON n.sender_type = 'responder' AND n.sender_id = r.id
           WHERE n.account_type = $1 AND n.account_id = $2 AND n.is_read = FALSE
           ORDER BY n.created_at DESC`,
          [accountType, userId]
        );
        
        return res.status(200).json({ notifications: rows });
      }
    }

    if (method === 'POST') {
      const { notificationId } = req.body;
      await client.query(
        `UPDATE notifications
         SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [notificationId]
      );
      
      return res.status(200).json({ message: 'Notification marked as read' });
    }

    if (method === 'PUT') {
      if (showAll === 'true') {
        // Mark all notifications as read
        await client.query(
          `UPDATE notifications
           SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE is_read = FALSE`,
        );
      } else {
        // Mark all notifications for a specific user as read
        await client.query(
          `UPDATE notifications
           SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE account_type = $1 AND account_id = $2 AND is_read = FALSE`,
          [accountType, userId]
        );
      }
      
      return res.status(200).json({ message: 'All notifications marked as read' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Error handling notifications:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
}