// pages/api/pcr/index.js
import pool from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { rows } = await pool.query(`
        SELECT id, patient_name, date, location, recorder, full_form, created_by_type, created_by_id
        FROM pcr_forms
        ORDER BY date DESC
      `);
      res.status(200).json({ data: rows });
    } catch (error) {
      console.error("Failed to fetch PCR forms:", error);
      res.status(500).json({ error: "Failed to fetch PCR forms" });
    }
  } else if (req.method === "POST") {
    try {
      const {
        patientName,
        date,
        poi,
        recorder,
        ...fullForm
      } = req.body;

      // Basic validation
      if (!patientName || !date || !recorder) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO pcr_forms (
          patient_name,
          date,
          location,
          recorder,
          full_form,
          created_by_type,
          created_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
        [
          patientName,
          date,
          poi?.brgy || "",
          recorder,
          fullForm,
          "user", // Replace with actual user type (e.g., from auth)
          1, // Replace with actual user ID (e.g., from auth)
        ]
      );

      res.status(201).json({ data: rows[0] });
    } catch (error) {
      console.error("Failed to save PCR form:", error);
      res.status(500).json({ error: "Failed to save PCR form" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}