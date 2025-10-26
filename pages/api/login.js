import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import os from 'os';

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
    console.error('GeoIP lookup error:', error);
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

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || password !== admin.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ip = getIPv4FromRequest(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const location = await getGeoLocation(ip);

    // Insert session
    const sessionInsert = await pool.query(
      `INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active)
       VALUES ($1, $2, $3, TRUE)
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
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    res.setHeader('Set-Cookie', serialized);
    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
