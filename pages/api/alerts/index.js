import pool from '@/lib/db'; // ✅ NO curly braces

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT 
          alerts.*,
          users.name AS resident_name,
          responders.name AS responder_name
        FROM alerts
        LEFT JOIN users ON alerts.user_id = users.id
        LEFT JOIN responders ON alerts.responder_id = responders.id
        ORDER BY alerts.created_at DESC
      `);

      const alerts = result.rows.map((alert) => ({
        id: alert.id,
        address: alert.address,
        type: alert.type,
        status: alert.status,
        occurred_at: alert.occurred_at,
        lat: alert.lat,
        lng: alert.lng,
        created_at: alert.created_at,
        responded_at: alert.responded_at,
        resident_name: alert.resident_name || 'Unknown User',
        responder_name: alert.responder_name || 'Not Assigned',
        description: alert.description || '', // Added description field
      }));

      res.status(200).json({ alerts });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}