import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { id } = req.query;

  // Verify JWT token
  const token = req.cookies.auth;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch authenticated user
    let user;
    let type;
    const adminRes = await pool.query(
      "SELECT id, name FROM admins WHERE id = $1",
      [decoded.id]
    );
    if (adminRes.rows.length > 0) {
      user = adminRes.rows[0];
      type = "admin";
    } else {
      const responderRes = await pool.query(
        "SELECT id, name FROM responders WHERE id = $1",
        [decoded.id]
      );
      if (responderRes.rows.length > 0) {
        user = responderRes.rows[0];
        type = "responder";
      }
    }

    if (!user) return res.status(404).json({ error: "Authenticated user not found" });

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
            bodyDiagram: Array.isArray(fullForm.bodyDiagram) ? fullForm.bodyDiagram : [],
          },
        };

        res.status(200).json({ success: true, data: responseData });
      } catch (error) {
        console.error("Error fetching PCR form:", error);
        res.status(500).json({ error: "Database error while fetching PCR form." });
      }
    } else if (req.method === "PUT") {
      try {
        const { patient_name, date, location, recorder, full_form } = req.body;

        // Process the full_form data to ensure proper date handling
        const processedFullForm = {
          ...full_form,
          patientSignatureDate: full_form.patientSignatureDate || null,
          witnessSignatureDate: full_form.witnessSignatureDate || null,
          receivingSignatureDate: full_form.receivingSignatureDate || null,
          bodyDiagram: Array.isArray(full_form.bodyDiagram)
            ? full_form.bodyDiagram.filter(
                (entry) =>
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

        // Insert notification (best-effort)
        try {
          const acctType = (type || 'admin').toLowerCase(); // 'admin' | 'responder'
          const senderType = acctType; // alerts category
          await pool.query(
            `
            INSERT INTO notifications (
              account_type,
              account_id,
              sender_type,
              sender_id,
              sender_name,
              recipient_name,
              message,
              is_read,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW() AT TIME ZONE 'Asia/Manila')
            `,
            [
              acctType,
              user.id,
              senderType,
              user.id,
              user.name || 'System',
              user.name || 'System',
              `${acctType.charAt(0).toUpperCase() + acctType.slice(1)} ${user.name || 'System'} updated a PCR form for patient ${patient_name} on ${new Date().toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}`
            ]
          );
        } catch (err) {
          console.error('PCR update notification failed:', err.message);
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
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}