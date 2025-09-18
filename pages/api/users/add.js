import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

    const { fullName, email, dob, contact, address, role } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let insertQuery = "";
    let values = [];
    let targetTable = "";
    let targetRole = "";

    if (role === "Residents") {
      targetTable = "users";
      targetRole = "Resident";
      insertQuery = `
        INSERT INTO users (name, email, dob, contact, address, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, dob, contact, address
      `;
      values = [fullName, email, dob || null, contact || "", address || "", "user123"];
    } else if (role === "Responders") {
      targetTable = "responders";
      targetRole = "Responder";
      insertQuery = `
        INSERT INTO responders (name, email, dob, contact, address, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, dob, contact, address
      `;
      values = [fullName, email, dob || null, contact || "", address || "", "responder123"];
    } else if (role === "Co-Admins") {
      targetTable = "admins";
      targetRole = "Co-Admin";
      insertQuery = `
        INSERT INTO admins (name, email, dob, contact, address, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, dob, contact, address
      `;
      values = [fullName, email, dob || null, contact || "", address || "", "admin123"];
    } else {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Insert user
    const result = await pool.query(insertQuery, values);

    // Insert notification
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
        type,
        user.id,
        type,
        user.id,
        user.name || "Unknown",
        user.name || "Unknown",
        `Admin ${user.name || "Unknown"} added a ${targetRole} account for ${fullName} on ${new Date().toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })}`
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}