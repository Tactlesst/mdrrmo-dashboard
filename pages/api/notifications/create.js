import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { accountType, accountId, senderType, senderId, senderName, recipientName, message } = req.body;

  if (!accountType || !accountId || !senderType || !message || !senderName || !recipientName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Normalize and validate types
  const acctType = String(accountType).toLowerCase();
  const sType = String(senderType).toLowerCase();
  const allowedAcct = ['admin', 'responder'];
  const allowedSender = ['admin', 'responder', 'system', 'chat'];
  if (!allowedAcct.includes(acctType)) {
    return res.status(400).json({ message: `Invalid accountType: ${accountType}` });
  }
  if (!allowedSender.includes(sType)) {
    return res.status(400).json({ message: `Invalid senderType: ${senderType}` });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query(`SET TIME ZONE 'Asia/Manila'`);

    const { rows } = await client.query(
      `INSERT INTO notifications (
         account_type, account_id, sender_type, sender_id, sender_name, recipient_name, message, is_read, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW() AT TIME ZONE 'Asia/Manila')
       RETURNING id, account_type, sender_type`,
      [acctType, accountId, sType, senderId ?? null, senderName, recipientName, message]
    );

    return res.status(201).json({
      message: 'Notification created successfully',
      notificationId: rows[0].id,
      account_type: rows[0].account_type,
      sender_type: rows[0].sender_type,
    });
  } catch (err) {
    logger.error('Error creating notification:', err.message);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
}