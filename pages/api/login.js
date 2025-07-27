import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs'; // You should be using bcrypt if passwords are hashed

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      await client.end();
      return res.status(401).json({ message: 'Invalid login credentials (email)' });
    }

    // ❌ For plaintext password (NOT recommended for production)
    if (password !== admin.password) {
      await client.end();
      return res.status(401).json({ message: 'Invalid login credentials (password)' });
    }

    // ✅ JWT token creation
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Set Cookie
    const serialized = serialize('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    res.setHeader('Set-Cookie', serialized);

    // ✅ Get IP and User Agent
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

// ✅ Insert login log into DB
await client.query(
  `INSERT INTO login_logs (admin_id, email, ip_address, user_agent)
   VALUES ($1, $2, $3, $4)`,
  [admin.id, admin.email, ip, userAgent]
);


    await client.end();
    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });

  } catch (error) {
    await client.end();
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
