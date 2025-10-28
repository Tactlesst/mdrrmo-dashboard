// pages/api/logout.js
import { serialize } from 'cookie';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { logSecurityEvent, getClientIP, SecurityEventTypes, SeverityLevels } from '@/lib/securityLogger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies.auth;
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  let userEmail = null;

  try {
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionId = decoded.sessionId;
      userEmail = decoded.email;

      if (sessionId) {
        // ✅ Mark session inactive using centralized pool
        await pool.query(
          'UPDATE admin_sessions SET is_active = FALSE, last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
          [sessionId]
        );
        
        // Log successful logout
        await logSecurityEvent({
          eventType: SecurityEventTypes.LOGOUT,
          email: userEmail,
          ipAddress: clientIP,
          userAgent,
          details: 'User logged out successfully',
          severity: SeverityLevels.LOW,
        });
      }
    }
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
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );

  res.status(200).json({ message: 'Logged out' });
}
