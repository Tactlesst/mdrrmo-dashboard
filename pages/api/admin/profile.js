// pages/api/admin/profile.js
import { Client } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth;

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
  await client.connect();

  try {
    if (req.method === 'GET') {
      const result = await client.query(
        'SELECT id, email, name, profile_image_url FROM admins WHERE email = $1',
        [user.email]
      );
      return res.status(200).json({ success: true, admin: result.rows[0] });
    }

    if (req.method === 'PUT') {
      const { name, profile_image_url, password } = req.body;

      if (password) {
        await client.query(
          'UPDATE admins SET password = $1 WHERE email = $2',
          [password, user.email]
        );
      }

      await client.query(
        'UPDATE admins SET name = $1, profile_image_url = $2 WHERE email = $3',
        [name || '', profile_image_url || '', user.email]
      );

      return res.status(200).json({ message: 'Profile updated' });
    }

    res.status(405).json({ message: 'Method Not Allowed' });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await client.end();
  }
}
