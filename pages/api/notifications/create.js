import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { accountType, accountId, senderType, senderId, message } = req.body;

  if (!accountType || !accountId || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let client;
  try {
    client = await pool.connect();
    
    const { rows } = await client.query(
      `INSERT INTO notifications (account_type, account_id, sender_type, sender_id, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, updated_at`,
      [accountType, accountId, senderType, senderId, message]
    );
    
    return res.status(201).json({ 
      message: 'Notification created successfully',
      notification: rows[0] // returns id + timestamps
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
}
