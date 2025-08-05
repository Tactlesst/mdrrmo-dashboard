import db from '@/lib/db';

export default async function handler(req, res) {
  const { provinceId } = req.query;
  if (!provinceId) return res.status(400).json({ error: 'Missing provinceId' });

  try {
    const result = await db.query(
      `SELECT id, name FROM municipalities WHERE province_id = $1 ORDER BY name ASC`,
      [provinceId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch municipalities' });
  }
}
