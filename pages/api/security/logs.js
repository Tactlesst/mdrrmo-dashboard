// pages/api/security/logs.js - View security logs
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify JWT token (admin only)
  const token = req.cookies.auth;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user is an admin
    const adminCheck = await pool.query(
      'SELECT id, email FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied - Admin only' });
    }

    // Get query parameters for filtering
    const {
      limit = 100,
      offset = 0,
      eventType,
      email,
      severity,
      startDate,
      endDate,
    } = req.query;

    // Build query with filters
    let query = 'SELECT * FROM security_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (eventType) {
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
      paramCount++;
    }

    if (email) {
      query += ` AND email ILIKE $${paramCount}`;
      params.push(`%${email}%`);
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
    let countQuery = 'SELECT COUNT(*) FROM security_logs WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (eventType) {
      countQuery += ` AND event_type = $${countParamCount}`;
      countParams.push(eventType);
      countParamCount++;
    }

    if (email) {
      countQuery += ` AND email ILIKE $${countParamCount}`;
      countParams.push(`%${email}%`);
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

    // Get statistics
    const statsQuery = `
      SELECT 
        event_type,
        severity,
        COUNT(*) as count
      FROM security_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY event_type, severity
      ORDER BY count DESC
    `;
    const statsResult = await pool.query(statsQuery);

    res.status(200).json({
      logs: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < totalCount,
      },
      statistics: {
        last24Hours: statsResult.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching security logs:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
}
