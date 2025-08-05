import db from '@/lib/db';

export default async function handler(req, res) {
  try {
    const result = await db.query(`SELECT id, name FROM provinces ORDER BY name ASC`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
}
