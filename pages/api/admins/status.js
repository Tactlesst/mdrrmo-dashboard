// pages/api/admins/status.js
import { Client } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        a.id,
        a.name,
        a.profile_image_url,
        a.email,
        COALESCE(s.is_active, false) AS is_active,
        CASE 
          WHEN s.is_active THEN 'Online' 
          ELSE 'Offline' 
        END AS status
      FROM admins a
      LEFT JOIN LATERAL (
        SELECT is_active
        FROM admin_sessions
        WHERE admin_email = a.email
        ORDER BY last_active_at DESC
        LIMIT 1
      ) s ON true
      ORDER BY a.name;
    `);

    res.status(200).json({ admins: result.rows });
  } catch (error) {
    console.error('Failed to fetch admin status:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
}
