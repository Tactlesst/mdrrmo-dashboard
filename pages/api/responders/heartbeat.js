// pages/api/responders/heartbeat.js
import { executeQuery } from '@/lib/dbQuery';
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

    // Update last_active_at timestamp in responder_sessions
    await executeQuery(
      `UPDATE responder_sessions 
       SET last_active_at = NOW(), 
           is_active = TRUE 
       WHERE responder_id = $1`,
      [responderId]
    );

    return res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    logger.error('Responder heartbeat error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
