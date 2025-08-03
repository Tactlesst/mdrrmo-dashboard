import db from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { rows } = await db.query('SELECT id, name FROM provinces ORDER BY name ASC');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
}
