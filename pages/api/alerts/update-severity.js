import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { alertId, severity } = req.body;

  if (!alertId || !severity) {
    return res.status(400).json({ error: 'Missing alertId or severity' });
  }

  // Validate severity value
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({ error: 'Invalid severity value' });
  }

  try {
    const result = await pool.query(
      'UPDATE alerts SET severity = $1 WHERE id = $2 RETURNING *',
      [severity, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(200).json({
      success: true,
      alert: result.rows[0],
      message: `Alert severity updated to ${severity}`
    });
  } catch (error) {
    console.error('Error updating alert severity:', error);
    return res.status(500).json({ error: 'Failed to update alert severity' });
  }
}
