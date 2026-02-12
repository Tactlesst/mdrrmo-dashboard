import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const secret = req.headers['x-presence-secret'];
  if (!process.env.WS_PRESENCE_SECRET || secret !== process.env.WS_PRESENCE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { email, isActive } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'email is required' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be boolean' });
  }

  try {
    await pool.query(
      `INSERT INTO admin_sessions (admin_email, is_active, last_active_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (admin_email)
       DO UPDATE SET is_active = EXCLUDED.is_active, last_active_at = NOW()`,
      [email, isActive]
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}
