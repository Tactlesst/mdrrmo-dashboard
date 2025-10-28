import pool from '@/lib/db';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, email, created_at
      FROM responders
      ORDER BY created_at DESC
    `);

    const responders = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
    }));

    res.status(200).json({ responders });
  } catch (error) {
    logger.error('Error fetching responders:', error.message);
    res.status(500).json({ message: 'Failed to fetch responders' });
  }
}