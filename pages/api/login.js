import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import os from 'os';
import { logSecurityEvent, getClientIP, SecurityEventTypes, SeverityLevels } from '@/lib/securityLogger';
import logger from '@/lib/logger';

// GeoIP helper
async function getGeoLocation(ip) {
  try {
    if (
      ip === 'Unknown' ||
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      return 'Local/Private IP';
    }

    const response = await fetch(`https://ipapi.co/${ip}/json`);
    if (!response.ok) throw new Error(`GeoIP request failed: ${response.status}`);
    const data = await response.json();
    return `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
  } catch (error) {
    logger.error('GeoIP lookup error:', error.message);
    return 'Unknown';
  }
}

// IP resolver
function getIPv4FromRequest(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'Unknown';

  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  if (process.env.NODE_ENV !== 'production' && (ip === '::1' || ip === '127.0.0.1')) {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  return ip;
}

// Login handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // Validation: Required fields
  if (!email || !password) {
    await logSecurityEvent({
      eventType: SecurityEventTypes.VALIDATION_FAILED,
      email: email || null,
      ipAddress: clientIP,
      userAgent,
      details: 'Missing email or password',
      severity: SeverityLevels.LOW,
    });
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Validation: Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await logSecurityEvent({
      eventType: SecurityEventTypes.VALIDATION_FAILED,
      email,
      ipAddress: clientIP,
      userAgent,
      details: 'Invalid email format',
      severity: SeverityLevels.LOW,
    });
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || password !== admin.password) {
      // Log failed login attempt
      await logSecurityEvent({
        eventType: SecurityEventTypes.LOGIN_FAILED,
        email,
        ipAddress: clientIP,
        userAgent,
        details: `Failed login attempt - ${!admin ? 'User not found' : 'Invalid password'}`,
        severity: SeverityLevels.MEDIUM,
      });
      // Generic message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ip = getIPv4FromRequest(req);
    const location = await getGeoLocation(ip);

    // Mark all previous sessions for this user as inactive
    await pool.query(
      `UPDATE admin_sessions 
       SET is_active = FALSE 
       WHERE admin_email = $1 AND is_active = TRUE`,
      [admin.email]
    );

    // Insert new session
    const sessionInsert = await pool.query(
      `INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active, last_active_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       RETURNING id`,
      [admin.email, `${ip} (${location})`, userAgent]
    );

    const sessionId = sessionInsert.rows[0].id;

    // Insert login log
    await pool.query(
      `INSERT INTO login_logs (admin_id, email, ip_address, user_agent, login_time)
       VALUES ($1, $2, $3, $4, NOW() AT TIME ZONE 'Asia/Manila')`,
      [admin.id, admin.email, ip, userAgent]
    );

    // Insert login notification as System
    await pool.query(
      `INSERT INTO notifications (account_type, account_id, sender_type, sender_id, sender_name, recipient_name, message, is_read, created_at)
       VALUES ($1, $2, 'system', NULL, 'System', $3, $4, FALSE, NOW() AT TIME ZONE 'Asia/Manila')`,
      [
        'admin',
        admin.id,
        admin.name || admin.email,
        `Admin ${admin.name || admin.email} logged in from ${ip} (${location}) on ${new Date().toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })}`,
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const serialized = serialize('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    res.setHeader('Set-Cookie', serialized);
    
    // Log successful login
    await logSecurityEvent({
      eventType: SecurityEventTypes.LOGIN_SUCCESS,
      email: admin.email,
      ipAddress: clientIP,
      userAgent,
      details: `Successful login from ${location}`,
      severity: SeverityLevels.LOW,
    });
    
    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });

  } catch (error) {
    logger.error('Login error:', error.message);
    
    // Log system error
    await logSecurityEvent({
      eventType: 'system_error',
      email: email || null,
      ipAddress: clientIP,
      userAgent,
      details: `Login system error: ${error.message}`,
      severity: SeverityLevels.HIGH,
    });
    
    res.status(500).json({ message: 'Internal server error' });
  }
}
