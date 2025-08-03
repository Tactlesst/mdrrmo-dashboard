import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, name, email, contact, dob, address } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Helper to attempt update in one table
  const tryUpdate = async (table) => {
    const result = await pool.query(
      `UPDATE ${table}
       SET name = $1, email = $2, contact = $3, dob = $4, address = $5
       WHERE id = $6
       RETURNING id, name, email, contact, dob, address`,
      [name, email, contact || '', dob || null, address || '', id]
    );
    return result;
  };

  try {
    const tables = ['users', 'responders', 'admins'];
    let updatedUser = null;

    for (const table of tables) {
      const result = await tryUpdate(table);
      if (result.rowCount > 0) {
        updatedUser = result.rows[0];
        break;
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found in any table' });
    }

    return res.status(200).json({ message: 'User updated successfully', user: updatedUser });

  } catch (error) {
    console.error('🔴 Update error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
