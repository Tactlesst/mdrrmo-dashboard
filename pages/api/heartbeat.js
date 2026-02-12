// pages/api/heartbeat.js
import pool from '@/lib/db';
import { queryWithTimeout } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const adminEmail = decoded.email;

    // Update admin session - sets both timestamp AND is_active flag
    // Note: This requires the session to already exist. For full fix, run database-migration-fix-admin-sessions.sql
    try {
      await queryWithTimeout(
        `INSERT INTO admin_sessions (admin_email, is_active, last_active_at)
         VALUES ($1, TRUE, NOW())
         ON CONFLICT (admin_email)
         DO UPDATE SET is_active = TRUE, last_active_at = NOW()`,
        [adminEmail],
        8000
      );
    } catch (dbErr) {
      const msg = dbErr?.message || String(dbErr);
      if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('query read timeout')) {
        return res.status(200).json({ success: true, skipped: true, reason: 'db_timeout' });
      }
      throw dbErr;
    }

    return res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
