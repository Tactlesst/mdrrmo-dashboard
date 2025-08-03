import pool from '@/lib/db'; // use the shared db pool

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const {
      patient_name,
      date,
      location,
      recorder,
      full_form,
      created_by_type,
      created_by_id,
    } = req.body;

    if (!['admin', 'responder'].includes(created_by_type)) {
      return res.status(400).json({ error: 'Invalid creator type.' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO pcr_forms (
          patient_name, date, location, recorder, full_form,
          created_by_type, created_by_id
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING *`,
        [
          patient_name,
          date,
          location,
          recorder,
          full_form,
          created_by_type,
          created_by_id,
        ]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error inserting PCR form:', error);
      res.status(500).json({ error: 'Database error while inserting PCR form.' });
    }
  } else if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM pcr_forms ORDER BY created_at DESC');
      res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error('Error fetching PCR forms:', error);
      res.status(500).json({ error: 'Database error while fetching PCR forms.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
