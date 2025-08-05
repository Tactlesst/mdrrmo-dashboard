import pool from '@/lib/db';
import { format } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT id, address, type, status, occurred_at, lat, lng, created_at
      FROM alerts
      ORDER BY occurred_at DESC
    `);

    const rows = result.rows;

    let csv = 'ID,Address,Type,Status,Occurred At,Latitude,Longitude,Created At\n';
    for (const row of rows) {
      const line = [
        row.id,
        `"${row.address || ''}"`,
        row.type,
        row.status,
        format(new Date(row.occurred_at), 'yyyy-MM-dd HH:mm:ss'),
        row.lat,
        row.lng,
        format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
      ].join(',');
      csv += line + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=alerts.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export alerts' });
  }
}
