// pages/api/logout.js
import { serialize } from 'cookie';
import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const token = req.cookies.auth;

  if (!token) {
    return res.status(400).json({ message: 'No auth token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessionId = decoded.sessionId;

    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
    await client.connect();

    // ✅ Mark session inactive
    await client.query(
      `UPDATE admin_sessions SET is_active = FALSE, last_active_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [sessionId]
    );

    await client.end();
  } catch (err) {
    console.error('Logout error:', err);
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
