import db from '@/lib/db';

export default async function handler(req, res) {
  const { provinceId } = req.query;
  if (req.method !== 'GET') return res.status(405).end();
  if (!provinceId) return res.status(400).json({ error: 'Missing provinceId' });

  try {
    const { rows } = await db.query(
      'SELECT id, name FROM municipalities WHERE province_id = $1 ORDER BY name ASC',
      [provinceId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch municipalities' });
  }
}
