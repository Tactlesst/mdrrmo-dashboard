import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || !admin.password || password !== admin.password) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        subject: admin.id.toString(),
        expiresIn: '1d',
      }
    );

    // Set cookie
    res.setHeader('Set-Cookie', serialize('auth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    }));

    res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing client:', endError.message);
    }
  }
}
