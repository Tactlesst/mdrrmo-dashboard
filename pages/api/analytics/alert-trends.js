// pages/api/analytics/alerts.js
import pool from '@/lib/db';

export default async function handler(req, res) {
  try {
    const { rows: alertsPerDay } = await pool.query(`
      SELECT 
        DATE_TRUNC('day', occurred_at) AS day,
        COUNT(*) AS alert_count
      FROM alerts
      GROUP BY day
      ORDER BY day
    `);

    const { rows: respondersActive } = await pool.query(`
      SELECT 
        DATE_TRUNC('day', responded_at) AS day,
        COUNT(DISTINCT responder_id) AS active_responders
      FROM alerts
      WHERE responder_id IS NOT NULL
      GROUP BY day
      ORDER BY day
    `);

    res.status(200).json({ alertsPerDay, respondersActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
