// pages/api/pcr/[id].js
import pool from '@/lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM pcr_forms WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'PCR form not found.' });
      }

      res.status(200).json({ data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching PCR form:', error);
      res.status(500).json({ error: 'Database error while fetching PCR form.' });
    }
  } else if (req.method === 'PUT') {
    const {
      patient_name,
      date,
      location,
      recorder,
      full_form,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE pcr_forms SET
          patient_name = $1,
          date = $2,
          location = $3,
          recorder = $4,
          full_form = $5::jsonb
         WHERE id = $6
         RETURNING *`,
        [patient_name, date, location, recorder, full_form, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'PCR form not found.' });
      }

      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error updating PCR form:', error);
      res.status(500).json({ error: 'Database error while updating PCR form.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
