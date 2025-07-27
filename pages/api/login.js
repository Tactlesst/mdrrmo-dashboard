import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const sql = neon(); // uses NETLIFY_DATABASE_URL by default

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  try {
    const [admin] = await sql`SELECT * FROM admins WHERE email = ${email}`;

    if (!admin || !admin.password || password !== admin.password) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const token = jwt.sign(
      { email: admin.email },
      process.env.JWT_SECRET,
      {
        subject: admin.id.toString(),
        expiresIn: '1d',
      }
    );

    res.setHeader('Set-Cookie', serialize('auth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    }));

    return res.status(200).json({ message: 'Login successful', redirect: '/AdminDashboard' });

  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
