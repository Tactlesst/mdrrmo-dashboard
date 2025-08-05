import db from '@/lib/db';

export default async function handler(req, res) {
  const { barangayId } = req.query;
  if (!barangayId) return res.status(400).json({ error: 'Missing barangayId' });

  try {
    const result = await db.query(
      `SELECT id, name FROM streets WHERE barangay_id = $1 ORDER BY name ASC`,
      [barangayId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streets' });
  }
}
