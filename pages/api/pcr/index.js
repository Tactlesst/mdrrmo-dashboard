
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import logger from "@/lib/logger";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { rows } = await pool.query(`
        SELECT *
        FROM pcr_forms
        ORDER BY created_at DESC
      `);
      res.status(200).json({ data: rows });
    } catch (error) {
      logger.error("Failed to fetch PCR forms:", error.message);
      res.status(500).json({ error: "Failed to fetch PCR forms" });
    }
  } else if (req.method === "POST") {
    try {
      const token = req.cookies.auth;
      if (!token) return res.status(401).json({ error: "Not authenticated" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

      if (!user) return res.status(404).json({ error: "User not found" });

      const { patientName, date, location, recorder, poi, alertId, ...fullForm } = req.body;
      if (!patientName || !date || !recorder) {
        return res.status(400).json({ error: "Missing required fields: patientName, date, recorder" });
      }

      logger.debug("Incoming POST req.body:", JSON.stringify(req.body, null, 2));

      const validateTimeFormat = (time) => {
        return time && /^\d{2}:\d{2}\s(AM|PM)$/.test(time) ? time : "";
      };

      const { rows } = await pool.query(
        `
        INSERT INTO pcr_forms (
          patient_name,
          date,
          location,
          recorder,
          full_form,
          created_by_type,
          created_by_id,
          alert_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
          patientName,
          date,
          location || poi?.brgy || "",
          recorder,
          {
            ...fullForm,
            alertId: alertId || fullForm.alertId || null, // Keep in JSONB for backward compatibility
            poi: poi || {},
            timeCall: validateTimeFormat(fullForm.timeCall),
            timeArrivedScene: validateTimeFormat(fullForm.timeArrivedScene),
            timeLeftScene: validateTimeFormat(fullForm.timeLeftScene),
            timeArrivedHospital: validateTimeFormat(fullForm.timeArrivedHospital),
          },
          type,
          user.id,
          alertId || fullForm.alertId || null // New alert_id column
        ]
      );

      // Insert notification for PCR form creation (best-effort)
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
            `${acctType.charAt(0).toUpperCase() + acctType.slice(1)} ${user.name || 'System'} added a PCR form for patient ${patientName} on ${new Date().toLocaleString('en-PH', {
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
        logger.error('PCR create notification failed:', err.message);
      }

      logger.debug("Inserted data:", JSON.stringify(rows[0], null, 2));
      res.status(201).json({ data: rows[0] });
    } catch (error) {
      logger.error("Failed to save PCR form:", error.message);
      res.status(500).json({ error: "Failed to save PCR form" });
    }
  } else if (req.method === "PUT") {
    try {
      const id = req.query.id || req.url.split("/").pop();
      if (!id) return res.status(400).json({ error: "Form ID is required" });

      const token = req.cookies.auth;
      if (!token) return res.status(401).json({ error: "Not authenticated" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

      if (!user) return res.status(404).json({ error: "User not found" });

      const { patient_name, date, location, recorder, full_form, alert_id } = req.body;
      if (!patient_name || !date || !recorder) {
        return res.status(400).json({ error: "Missing required fields: patient_name, date, recorder" });
      }

      logger.debug("Incoming PUT req.body:", JSON.stringify(req.body, null, 2));

      // Fetch existing form to merge with updates
      const existingFormRes = await pool.query(
        "SELECT full_form, alert_id FROM pcr_forms WHERE id = $1",
        [id]
      );
      if (existingFormRes.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      const existingFullForm = existingFormRes.rows[0].full_form || {};
      const existingAlertId = existingFormRes.rows[0].alert_id;

      const validateTimeFormat = (time) => {
        return time && /^\d{2}:\d{2}\s(AM|PM)$/.test(time) ? time : "";
      };

      // Extract alertId from full_form if provided
      const newAlertId = alert_id || full_form?.alertId || existingAlertId || null;

      const updatedFullForm = {
        ...existingFullForm,
        ...full_form,
        alertId: newAlertId, // Keep in JSONB for backward compatibility
        poi: full_form.poi || existingFullForm.poi || {},
        timeCall: validateTimeFormat(full_form.timeCall || existingFullForm.timeCall),
        timeArrivedScene: validateTimeFormat(full_form.timeArrivedScene || existingFullForm.timeArrivedScene),
        timeLeftScene: validateTimeFormat(full_form.timeLeftScene || existingFullForm.timeLeftScene),
        timeArrivedHospital: validateTimeFormat(full_form.timeArrivedHospital || existingFullForm.timeArrivedHospital),
      };

      const { rows } = await pool.query(
        `
        UPDATE pcr_forms
        SET
          patient_name = $1,
          date = $2,
          location = $3,
          recorder = $4,
          full_form = $5,
          alert_id = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
        `,
        [
          patient_name,
          date,
          location || updatedFullForm.poi?.brgy || "",
          recorder,
          updatedFullForm,
          newAlertId,
          id
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Insert notification for PCR form update (best-effort)
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
        logger.error('PCR update notification failed (/api/pcr PUT):', err.message);
      }

      logger.debug("Updated data:", JSON.stringify(rows[0], null, 2));
      res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error("Failed to update PCR form:", error.message);
      res.status(500).json({ error: "Failed to update PCR form" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
