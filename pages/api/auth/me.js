import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    const token = req.cookies.auth;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id, email } = decoded;

    // Try to find in admins
    let result = await pool.query(
      `SELECT id, name, email, 'admin' AS type FROM admins WHERE id = $1`,
      [id]
    );

    // If not found in admins, try responders
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, name, email, 'responder' AS type FROM responders WHERE id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
