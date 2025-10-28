import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import logger from "@/lib/logger";

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

    // Validation: Required fields
    if (!fullName || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validation: Name length
    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: "Full name must be at least 2 characters" });
    }

    // Validation: Role validation
    const validRoles = ["Residents", "Responders", "Co-Admins"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Determine target table based on role
    let targetTable = "";
    let targetRole = "";
    if (role === "Residents") {
      targetTable = "users";
      targetRole = "Resident";
    } else if (role === "Responders") {
      targetTable = "responders";
      targetRole = "Responder";
    } else if (role === "Co-Admins") {
      targetTable = "admins";
      targetRole = "Co-Admin";
    }

    // Validation: Check for duplicate email in target table
    const duplicateCheck = await pool.query(
      `SELECT id FROM ${targetTable} WHERE email = $1`,
      [email]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: `Email already registered in this role` });
    }

    // Validation: Cross-table email check
    const crossCheckQueries = [];
    if (role !== "Residents") {
      crossCheckQueries.push(pool.query("SELECT id FROM users WHERE email = $1", [email]));
    }
    if (role !== "Responders") {
      crossCheckQueries.push(pool.query("SELECT id FROM responders WHERE email = $1", [email]));
    }
    if (role !== "Co-Admins") {
      crossCheckQueries.push(pool.query("SELECT id FROM admins WHERE email = $1", [email]));
    }

    const crossCheckResults = await Promise.all(crossCheckQueries);
    for (let i = 0; i < crossCheckResults.length; i++) {
      if (crossCheckResults[i].rows.length > 0) {
        const existingRole = role === "Residents" ? 
          (i === 0 ? "Responder" : "Admin") : 
          (role === "Responders" ? (i === 0 ? "Resident" : "Admin") : 
          (i === 0 ? "Resident" : "Responder"));
        return res.status(409).json({ error: `Email already registered as ${existingRole}` });
      }
    }

    let insertQuery = "";
    let values = [];

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
    const inserted = result.rows[0];
    const isAdminTarget = role === "Co-Admins";
    const notifAccountType = isAdminTarget ? "admin" : type;
    const notifAccountId = isAdminTarget ? inserted.id : user.id;
    const notifSenderType = isAdminTarget ? "system" : type;
    const notifSenderId = isAdminTarget ? null : user.id;
    const notifSenderName = isAdminTarget ? "System" : (user.name || "Unknown");
    const notifRecipientName = isAdminTarget ? (inserted.name || fullName) : (user.name || "Unknown");
    const actionText = isAdminTarget ? `System: Admin ${user.name || "Unknown"} added Co-Admin ${fullName}` : `Admin ${user.name || "Unknown"} added a ${targetRole} account for ${fullName}`;

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
        notifAccountType,
        notifAccountId,
        notifSenderType,
        notifSenderId,
        notifSenderName,
        notifRecipientName,
        `${actionText} on ${new Date().toLocaleString("en-PH", {
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
    logger.error("Error adding user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}