// pages/api/responders/heartbeat.js
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.responderToken;

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

    const responderId = decoded.id;

    // Update location_updated_at timestamp in responder_sessions
    await pool.query(
      `UPDATE responder_sessions 
       SET location_updated_at = NOW()
       WHERE responder_id = $1 
         AND ended_at IS NULL`,
      [responderId]
    );

    return res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    logger.error('Responder heartbeat error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
