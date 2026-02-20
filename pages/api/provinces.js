import db from '@/lib/db';
import { getOrSetCache } from '@/lib/inMemoryCache';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    const rows = await getOrSetCache('geo:provinces', 5 * 60 * 1000, async () => {
      const result = await db.query('SELECT id, name FROM provinces ORDER BY name ASC');
      return result.rows;
    });
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
}
