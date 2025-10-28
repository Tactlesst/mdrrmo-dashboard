// pages/api/security/my-logs.js - View own security logs (user-specific)
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify JWT token
  const token = req.cookies.auth;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists (admin or responder)
    let userEmail = null;
    
    const adminCheck = await pool.query(
      'SELECT email FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (adminCheck.rows.length > 0) {
      userEmail = adminCheck.rows[0].email;
    } else {
      const responderCheck = await pool.query(
        'SELECT email FROM responders WHERE id = $1',
        [decoded.id]
      );
      
      if (responderCheck.rows.length > 0) {
        userEmail = responderCheck.rows[0].email;
      }
    }

    if (!userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get query parameters for filtering
    const {
      limit = 50,
      offset = 0,
      eventType,
      severity,
      startDate,
      endDate,
    } = req.query;

    // Build query - ONLY for the logged-in user's email
    let query = 'SELECT * FROM security_logs WHERE email = $1';
    const params = [userEmail];
    let paramCount = 2;

    if (eventType) {
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
      paramCount++;
    }

    if (severity) {
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM security_logs WHERE email = $1';
    const countParams = [userEmail];
    let countParamCount = 2;

    if (eventType) {
      countQuery += ` AND event_type = $${countParamCount}`;
      countParams.push(eventType);
      countParamCount++;
    }

    if (severity) {
      countQuery += ` AND severity = $${countParamCount}`;
      countParams.push(severity);
      countParamCount++;
    }

    if (startDate) {
      countQuery += ` AND created_at >= $${countParamCount}`;
      countParams.push(startDate);
      countParamCount++;
    }

    if (endDate) {
      countQuery += ` AND created_at <= $${countParamCount}`;
      countParams.push(endDate);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get statistics for this user
    const statsQuery = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM security_logs
      WHERE email = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY count DESC
    `;
    const statsResult = await pool.query(statsQuery, [userEmail]);

    // Get recent activity summary
    const recentQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM security_logs
      WHERE email = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const recentResult = await pool.query(recentQuery, [userEmail]);

    res.status(200).json({
      logs: result.rows,
      userEmail,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < totalCount,
      },
      statistics: {
        last30Days: statsResult.rows,
        recentActivity: recentResult.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching user security logs:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
}
