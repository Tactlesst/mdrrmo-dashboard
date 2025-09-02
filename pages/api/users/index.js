import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const role = req.query.role;

  try {
    const client = await pool.connect();
    await client.query(`SET TIME ZONE 'Asia/Manila'`);

    let rows;
    if (role === 'Residents') {
      const { rows: result } = await client.query(
        `SELECT id, name, email, dob, contact, address, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );
      rows = result;
    } else if (role === 'Responders') {
      const { rows: result } = await client.query(
        `SELECT id, name, email, dob, contact, address, created_at 
         FROM responders 
         ORDER BY created_at DESC`
      );
      rows = result;
    } else if (role === 'Co-Admins') {
      const { rows: result } = await client.query(
        `SELECT id, name, email, dob, contact, address, created_at 
         FROM admins 
         ORDER BY created_at DESC`
      );
      rows = result;
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    client.release();

    const normalize = (rows) =>
      rows.map((u) => ({
        id: u.id,
        fullName: u.name,
        email: u.email,
        dob: u.dob || null,
        contact: u.contact || null,
        address: u.address || null,
        created_at: u.created_at ? u.created_at.toISOString() : null,
      }));

    return res.status(200).json(normalize(rows));
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}