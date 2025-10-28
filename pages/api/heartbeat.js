// pages/api/heartbeat.js
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth; // Changed from cookies.token to cookies.auth

    if (!token) {
      console.log('No auth token found in cookies:', Object.keys(cookies));
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

    // Update last_active_at timestamp in admin_sessions
    await pool.query(
      `UPDATE admin_sessions 
       SET last_active_at = NOW(), 
           is_active = TRUE 
       WHERE admin_email = $1`,
      [adminEmail]
    );

    return res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
