// /pages/api/export/pcr.js
import pool from '@/lib/db';
import logger from '@/lib/logger';
import { format } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT id, patient_name, date, location, recorder, created_by_type, created_by_id, created_at, full_form
      FROM pcr_forms
      ORDER BY date DESC
    `);

    const rows = result.rows;

    let csv = 'ID,Patient Name,Date,Location,Recorder,Created By Type,Created By ID,Created At,Case Number,Chief Complaint,Assessment\n';

    for (const row of rows) {
      const fullForm = row.full_form || {};
      const caseNumber = fullForm.case_number || '';
      const chiefComplaint = fullForm.chief_complaint || '';
      const assessment = fullForm.assessment || '';

      const line = [
        row.id,
        `"${row.patient_name}"`,
        format(new Date(row.date), 'yyyy-MM-dd'),
        `"${row.location || ''}"`,
        `"${row.recorder || ''}"`,
        row.created_by_type,
        row.created_by_id,
        format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
        `"${caseNumber}"`,
        `"${chiefComplaint}"`,
        `"${assessment}"`
      ].join(',');

      csv += line + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pcr_forms.csv');
    res.status(200).send(csv);
  } catch (error) {
    logger.error('Export PCR error:', error.message);
    res.status(500).json({ message: 'Failed to export PCR forms' });
  }
}
