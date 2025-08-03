import db from '@/lib/db';

export default async function handler(req, res) {
  const { municipalityId } = req.query;
  if (req.method !== 'GET') return res.status(405).end();
  if (!municipalityId) return res.status(400).json({ error: 'Missing municipalityId' });

  try {
    const { rows } = await db.query(
      'SELECT id, name FROM barangays WHERE municipality_id = $1 ORDER BY name ASC',
      [municipalityId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch barangays' });
  }
}
