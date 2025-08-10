// pages/api/pcr/index.js
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

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
  }

  else if (req.method === "POST") {
    try {
      // --- 🔹 Get logged-in user from JWT ---
      const token = req.cookies.auth;
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if admin
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

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // --- 🔹 Extract PCR form data from body ---
      const { patientName, date, poi, ...fullForm } = req.body;

      if (!patientName || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // --- 🔹 Save to DB ---
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
          user.name,       // recorder = actual logged-in user's name
          fullForm,
          type,            // "admin" or "responder"
          user.id          // integer ID of the logged-in user
        ]
      );

      res.status(201).json({ data: rows[0] });

    } catch (error) {
      console.error("Failed to save PCR form:", error);
      res.status(500).json({ error: "Failed to save PCR form" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
