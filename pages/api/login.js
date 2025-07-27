import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      await client.end();
      return res.status(401).json({ message: 'Invalid login credentials (email)' });
    }

    // ❌ Plaintext password comparison (NOT RECOMMENDED)
    if (password !== admin.password) {
      await client.end();
      return res.status(401).json({ message: 'Invalid login credentials (password)' });
    }

    // ✅ Create JWT Token
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
      maxAge: 60 * 60 * 24, // 1 day
    });

    res.setHeader('Set-Cookie', serialized);

    await client.end();
    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });
  } catch (error) {
    await client.end();
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
