// pages/api/logout.js
import { serialize } from 'cookie';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies.auth;

  try {
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionId = decoded.sessionId;

      if (process.env.NETLIFY_DATABASE_URL && sessionId) {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        // ✅ Mark session inactive
        await sql`UPDATE admin_sessions SET is_active = FALSE, last_active_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}`;
      }
    }
  } catch (err) {
    // still continue to clear the cookie
  }

  // ✅ Expire cookie
  res.setHeader(
    'Set-Cookie',
    serialize('auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })
  );

  res.status(200).json({ message: 'Logged out' });
}
