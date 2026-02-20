import db from '@/lib/db';
import { getOrSetCache } from '@/lib/inMemoryCache';

export default async function handler(req, res) {
  const { barangayId } = req.query;
  if (req.method !== 'GET') return res.status(405).end();
  if (!barangayId) return res.status(400).json({ error: 'Missing barangayId' });

  try {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    const rows = await getOrSetCache(`geo:streets:${barangayId}`, 5 * 60 * 1000, async () => {
      const result = await db.query(
        'SELECT id, name FROM streets WHERE barangay_id = $1 ORDER BY name ASC',
        [barangayId]
      );
      return result.rows;
    });
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streets' });
  }
}
