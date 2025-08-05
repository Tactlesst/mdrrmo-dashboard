import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, name, email, contact, dob, address, role } = req.body;

  if (!id || !name || !email || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let table = '';
  if (role === 'Residents') {
    table = 'users';
  } else if (role === 'Responders') {
    table = 'responders';
  } else if (role === 'Co-Admins') {
    table = 'admins';
  } else {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE ${table}
      SET name = $1, email = $2, contact = $3, dob = $4, address = $5
      WHERE id = $6
      RETURNING id, name, email, contact, dob, address
      `,
      [name, email, contact || '', dob || null, address || '', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });

  } catch (error) {
    console.error('🔴 Update error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
