// pages/api/alerts/locations.js
import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        a.id,
        a.type,
        a.lat,
        a.lng,
        a.status,
        r.name AS responder_name,
        a.address,
        a.occurred_at
      FROM alerts a
      LEFT JOIN responders r ON a.responder_id = r.id
      WHERE a.lat IS NOT NULL AND a.lng IS NOT NULL
      ORDER BY a.occurred_at DESC
      LIMIT 500
    `);

    return res.status(200).json({ locations: result.rows });
  } catch (err) {
    console.error('alerts/locations API error:', err);
    return res.status(500).json({ message: 'Failed to load alert locations' });
  } finally {
    await client.end();
  }
}
