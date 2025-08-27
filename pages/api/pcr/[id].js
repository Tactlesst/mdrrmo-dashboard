// pages/api/pcr/[id].js
import pool from "@/lib/db";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { patient_name, date, location, recorder, full_form } = req.body;

      const result = await pool.query(
        `UPDATE pcr_forms
         SET patient_name = $1,
             date = $2,
             location = $3,
             recorder = $4,
             full_form = $5::jsonb,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [patient_name, date, location, recorder, full_form, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error("Error updating PCR form:", error);
      res.status(500).json({ error: "Database error while updating PCR form." });
    }
  } else if (req.method === "DELETE") {
    try {
      const result = await pool.query(
        "DELETE FROM pcr_forms WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      res.status(200).json({ success: true, message: "Form deleted successfully." });
    } catch (error) {
      console.error("Error deleting PCR form:", error);
      res.status(500).json({ error: "Database error while deleting PCR form." });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
