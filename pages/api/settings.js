// pages/api/settings.js
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export default async function handler(req, res) {
  // Verify auth token for write operations
  const token = req.cookies?.auth;
  const requireAuth = () => {
    try {
      if (!token || !process.env.JWT_SECRET) return false;
      jwt.verify(token, process.env.JWT_SECRET);
      return true;
    } catch (_) {
      return false;
    }
  };

  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        website_url TEXT,
        apk_url TEXT,
        responder_apk_url TEXT,
        resident_apk_url TEXT
      )
    `);
    // Add new columns if upgrading from older schema
    await pool.query('ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS responder_apk_url TEXT');
    await pool.query('ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS resident_apk_url TEXT');

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT website_url, apk_url, responder_apk_url, resident_apk_url FROM app_settings WHERE id = 1');
      if (rows.length === 0) {
        await pool.query('INSERT INTO app_settings (id, website_url, apk_url, responder_apk_url, resident_apk_url) VALUES (1, $1, $2, $3, $4)', [
          'https://mdrrmo.example.com',
          '/apk/mddrmo-app.apk',
          '/apk/responder-app.apk',
          '/apk/resident-app.apk',
        ]);
        return res.status(200).json({
          website_url: 'https://mdrrmo.example.com',
          apk_url: '/apk/mddrmo-app.apk',
          responder_apk_url: '/apk/responder-app.apk',
          resident_apk_url: '/apk/resident-app.apk',
        });
      }
      const { website_url, apk_url, responder_apk_url, resident_apk_url } = rows[0];
      return res.status(200).json({
        website_url,
        apk_url,
        responder_apk_url: responder_apk_url || apk_url || null,
        resident_apk_url: resident_apk_url || apk_url || null,
      });
    }

    if (req.method === 'PUT') {
      if (!requireAuth()) {
        res.setHeader('Allow', 'GET, PUT');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { website_url, apk_url, responder_apk_url, resident_apk_url } = req.body || {};
      await pool.query(
        `INSERT INTO app_settings (id, website_url, apk_url, responder_apk_url, resident_apk_url)
         VALUES (1, $1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           website_url = COALESCE(EXCLUDED.website_url, app_settings.website_url),
           apk_url = COALESCE(EXCLUDED.apk_url, app_settings.apk_url),
           responder_apk_url = COALESCE(EXCLUDED.responder_apk_url, app_settings.responder_apk_url),
           resident_apk_url = COALESCE(EXCLUDED.resident_apk_url, app_settings.resident_apk_url)`,
        [
          website_url || null,
          apk_url || null,
          responder_apk_url || apk_url || null,
          resident_apk_url || apk_url || null,
        ]
      );

      return res.status(200).json({ message: 'Settings updated' });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', detail: String(err?.message || err) });
  }
}
