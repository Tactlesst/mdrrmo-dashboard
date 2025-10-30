// pages/api/admins/status.js
import pool from '@/lib/db';

export default async function handler(req, res) {
  try {
    // Run cleanup and data fetching in parallel for better performance
    const [_, adminResult, responderResult] = await Promise.all([
      // Auto-cleanup: Mark inactive sessions as offline (last_active_at > 3 minutes)
      pool.query(`
        UPDATE admin_sessions 
        SET is_active = FALSE 
        WHERE last_active_at < NOW() - INTERVAL '3 minutes' 
        AND is_active = TRUE
      `).then(() => 
        // Mark old responder sessions as ended (increased to 10 minutes for better tolerance)
        pool.query(`
          UPDATE responder_sessions 
          SET ended_at = NOW(),
              status = 'offline' 
          WHERE location_updated_at < NOW() - INTERVAL '10 minutes' 
          AND ended_at IS NULL
        `)
      ),

      // Fetch admins with session status (optimized with index hints)
      pool.query(`
        SELECT 
          a.id,
          a.name,
          a.profile_image_url,
          a.email,
          a.dob,
          a.contact,
          a.address,
          COALESCE(s.is_active, false) AS is_active,
          s.last_active_at,
          CASE 
            WHEN s.is_active AND s.last_active_at > NOW() - INTERVAL '3 minutes' THEN 'Online' 
            ELSE 'Offline' 
          END AS status
        FROM admins a
        LEFT JOIN LATERAL (
          SELECT is_active, last_active_at
          FROM admin_sessions
          WHERE admin_email = a.email
          ORDER BY last_active_at DESC
          LIMIT 1
        ) s ON true
        ORDER BY a.name;
      `),

      // Fetch responders with session status and their custom responder status (optimized)
      pool.query(`
        SELECT 
          r.id,
          r.name,
          r.profile_image_url,
          r.email,
          r.dob,
          r.contact,
          r.address,
          COALESCE(s.is_active, false) AS is_active,
          s.location_updated_at as last_active_at,
          COALESCE(s.status, 'offline') AS responder_status,
          CASE 
            WHEN s.is_active = true AND s.location_updated_at > NOW() - INTERVAL '10 minutes' THEN 
              CASE 
                WHEN s.status = 'standby' THEN 'Standby'
                WHEN s.status = 'ready to go' THEN 'Ready'
                ELSE 'Online'
              END
            ELSE 'Offline'
          END AS status
        FROM responders r
        LEFT JOIN LATERAL (
          SELECT 
            CASE WHEN ended_at IS NULL THEN true ELSE false END as is_active,
            status, 
            location_updated_at
          FROM responder_sessions
          WHERE responder_id = r.id
          ORDER BY location_updated_at DESC NULLS LAST
          LIMIT 1
        ) s ON true
        ORDER BY r.name;
      `)
    ]);

    res.status(200).json({
      admins: adminResult.rows,
      responders: responderResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch admin/responder status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
