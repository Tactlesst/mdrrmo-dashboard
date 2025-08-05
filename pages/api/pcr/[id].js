// pages/api/pcr.js
import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM pcr_forms ORDER BY created_at DESC');
      res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error('Error fetching PCR forms:', error);
      res.status(500).json({ error: 'Database error while fetching PCR forms.' });
    }
  } else if (req.method === 'POST') {
    const {
      patient_name,
      date,
      location,
      recorder,
      full_form,
      created_by_type,
      created_by_id,
    } = req.body;

    // Basic validation
    if (!patient_name || !date || !recorder || !created_by_type || !created_by_id) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO pcr_forms (
          patient_name, date, location, recorder, full_form, created_by_type, created_by_id
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING *`,
        [patient_name, date, location, recorder, full_form, created_by_type, created_by_id]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error creating PCR form:', error);
      res.status(500).json({ error: 'Database error while creating PCR form.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}