import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { accountType, accountId, senderType, senderId, senderName, recipientName, message } = req.body;

  if (!accountType || !accountId || !senderType || !message || !senderName || !recipientName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query(`SET TIME ZONE 'Asia/Manila'`);

    const { rows } = await client.query(
      `INSERT INTO notifications (
         account_type, account_id, sender_type, sender_id, sender_name, recipient_name, message, is_read, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW() AT TIME ZONE 'Asia/Manila')
       RETURNING id`,
      [accountType, accountId, senderType, senderId, senderName, recipientName, message]
    );

    return res.status(201).json({
      message: 'Notification created successfully',
      notificationId: rows[0].id,
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
}