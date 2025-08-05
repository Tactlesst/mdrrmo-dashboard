// pages/api/admins/status.js
import pool from '@/lib/db';

export default async function handler(req, res) {
  try {
    // Fetch admins with session status
    const adminResult = await pool.query(`
      SELECT 
        a.id,
        a.name,
        a.profile_image_url,
        a.email,
        a.dob,
        a.contact,
        a.address,
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

    // Fetch responders with session status and their custom responder status
    const responderResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.profile_image_url,
        r.email,
        r.dob,
        r.contact,
        r.address,
        COALESCE(s.is_active, false) AS is_active,
        COALESCE(s.status, 'offline') AS responder_status,
        CASE 
          WHEN s.status = 'online' THEN 'Online'
          WHEN s.status = 'standby' THEN 'Standby'
          WHEN s.status = 'ready to go' THEN 'Ready'
          ELSE 'Offline'
        END AS status
      FROM responders r
      LEFT JOIN LATERAL (
        SELECT is_active, status
        FROM responder_sessions
        WHERE responder_id = r.id
        ORDER BY last_active_at DESC
        LIMIT 1
      ) s ON true
      ORDER BY r.name;
    `);

    res.status(200).json({
      admins: adminResult.rows,
      responders: responderResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch admin/responder status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
