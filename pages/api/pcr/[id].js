// pages/api/pcr/[id].js
import pool from "@/lib/db";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT * FROM pcr_forms WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      const form = result.rows[0];

      // Extract signature URLs from JSON field and ensure proper date formatting
      const fullForm = form.full_form || {};
      
      // Format dates to ISO string for consistent handling
      const responseData = {
        ...form,
        full_form: {
          ...fullForm,
          patientSignature: fullForm.patientSignature || null,
          witnessSignature: fullForm.witnessSignature || null,
          receivingSignature: fullForm.receivingSignature || null,
          patientSignatureDate: fullForm.patientSignatureDate ? new Date(fullForm.patientSignatureDate).toISOString() : null,
          witnessSignatureDate: fullForm.witnessSignatureDate ? new Date(fullForm.witnessSignatureDate).toISOString() : null,
          receivingSignatureDate: fullForm.receivingSignatureDate ? new Date(fullForm.receivingSignatureDate).toISOString() : null,
          // Ensure bodyDiagram is always an array
          bodyDiagram: Array.isArray(fullForm.bodyDiagram) ? fullForm.bodyDiagram : [],
        },
      };

      res.status(200).json({ success: true, data: responseData });
    } catch (error) {
      console.error("Error fetching PCR form:", error);
      res.status(500).json({ error: "Database error while fetching PCR form." });
    }
  }

  else if (req.method === "PUT") {
    try {
      const { patient_name, date, location, recorder, full_form } = req.body;

      // Process the full_form data to ensure proper date handling
      const processedFullForm = {
        ...full_form,
        // Convert empty strings to null for date fields
        patientSignatureDate: full_form.patientSignatureDate || null,
        witnessSignatureDate: full_form.witnessSignatureDate || null,
        receivingSignatureDate: full_form.receivingSignatureDate || null,
        // Ensure bodyDiagram is properly formatted
        bodyDiagram: Array.isArray(full_form.bodyDiagram) 
          ? full_form.bodyDiagram.filter(entry => 
              entry && 
              typeof entry === "object" && 
              entry.bodyPart && 
              typeof entry.bodyPart === "string" &&
              entry.condition && 
              typeof entry.condition === "string"
            )
          : [],
      };

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
        [patient_name, date, location, recorder, processedFullForm, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Format the response data with proper date handling
      const updatedForm = result.rows[0];
      const updatedFullForm = updatedForm.full_form || {};
      
      const responseData = {
        ...updatedForm,
        full_form: {
          ...updatedFullForm,
          patientSignatureDate: updatedFullForm.patientSignatureDate ? new Date(updatedFullForm.patientSignatureDate).toISOString() : null,
          witnessSignatureDate: updatedFullForm.witnessSignatureDate ? new Date(updatedFullForm.witnessSignatureDate).toISOString() : null,
          receivingSignatureDate: updatedFullForm.receivingSignatureDate ? new Date(updatedFullForm.receivingSignatureDate).toISOString() : null,
          bodyDiagram: Array.isArray(updatedFullForm.bodyDiagram) ? updatedFullForm.bodyDiagram : [],
        },
      };

      res.status(200).json({ success: true, data: responseData });
    } catch (error) {
      console.error("Error updating PCR form:", error);
      res.status(500).json({ error: "Database error while updating PCR form." });
    }
  }

  else if (req.method === "DELETE") {
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
  }

  else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}