import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import os from 'os';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || password !== admin.password) {
      await client.end();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const serialized = serialize('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    res.setHeader('Set-Cookie', serialized);

    const ip = getIPv4FromRequest(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await client.query(
      `INSERT INTO login_logs (admin_id, email, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [admin.id, admin.email, ip, userAgent]
    );

    await client.end();
    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });

  } catch (error) {
    console.error('Login error:', error);
    await client.end();
    res.status(500).json({ message: 'Internal server error' });
  }
}
