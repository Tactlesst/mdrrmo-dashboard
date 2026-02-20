import db from '@/lib/db';
import { getOrSetCache } from '@/lib/inMemoryCache';

export default async function handler(req, res) {
  const { provinceId } = req.query;
  if (req.method !== 'GET') return res.status(405).end();
  if (!provinceId) return res.status(400).json({ error: 'Missing provinceId' });

  try {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    const rows = await getOrSetCache(`geo:municipalities:${provinceId}`, 5 * 60 * 1000, async () => {
      const result = await db.query(
        'SELECT id, name FROM municipalities WHERE province_id = $1 ORDER BY name ASC',
        [provinceId]
      );
      return result.rows;
    });
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch municipalities' });
  }
}
