import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, otherUserId, userType, otherUserType } = req.query;

  if (!userId || !otherUserId || !userType || !otherUserType) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Fetch chat messages between two users
    // Messages are stored in notifications table with sender_type = 'chat'
    const query = `
      SELECT 
        id,
        sender_id,
        sender_name,
        message,
        created_at,
        read
      FROM notifications
      WHERE sender_type = 'chat'
        AND (
          (sender_id = $1 AND account_id = $2 AND account_type = $3)
          OR
          (sender_id = $2 AND account_id = $1 AND account_type = $4)
        )
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [
      parseInt(userId),
      parseInt(otherUserId),
      otherUserType,
      userType
    ]);

    return res.status(200).json({
      success: true,
      messages: result.rows
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
