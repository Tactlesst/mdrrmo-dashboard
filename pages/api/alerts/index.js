import pool from '@/lib/db'; // use the shared db pool

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const {
      address,
      type,
      status,
      occurred_at,
      lat,
      lng,
      responder_id,
      responded_at,
    } = req.body || {};

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng are required and must be numbers' });
    }

    try {
      const insert = await pool.query(
        `INSERT INTO alerts (
          address, type, status, occurred_at, lat, lng, responder_id, responded_at
        )
        VALUES (
          $1, $2, COALESCE($3, 'Not Responded'), COALESCE($4, NOW()), $5, $6, $7, $8
        )
        RETURNING *`,
        [
          address || null,
          type || null,
          status,
          occurred_at,
          lat,
          lng,
          responder_id || null,
          responded_at || null,
        ]
      );

      return res.status(201).json({ alert: insert.rows[0] });
    } catch (err) {
      console.error('alerts POST error:', err);
      return res.status(500).json({ message: 'Database insert error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT 
          a.id,
          a.address,
          a.type,
          a.status,
          a.occurred_at,
          a.lat,
          a.lng,
          a.created_at,
          r.name AS responder_name
        FROM alerts a
        LEFT JOIN responders r ON a.responder_id = r.id
        ORDER BY a.occurred_at DESC, a.created_at DESC
        LIMIT 500`
      );

      return res.status(200).json({ alerts: result.rows });
    } catch (err) {
      console.error('alerts GET error:', err);
      return res.status(500).json({ message: 'Database fetch error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
