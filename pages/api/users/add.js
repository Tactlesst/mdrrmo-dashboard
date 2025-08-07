// /pages/api/users/add.js

import pool from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { fullName, email, dob, contact, address, role } = req.body;

  if (!fullName || !email || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let insertQuery = "";
    let values = [];

if (role === "Residents") {
  insertQuery = `
    INSERT INTO users (name, email, dob, contact, address, password)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  values = [fullName, email, dob, contact, address, "user123"];
}
else if (role === "Responders") {
      insertQuery = `
        INSERT INTO responders (name, email, dob, contact, address, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
      values = [fullName, email, dob, contact, address, "responder123"]; // Replace with hashed password if needed

    } else if (role === "Co-Admins") {
      insertQuery = `
        INSERT INTO admins (name, email, dob, contact, address, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
      values = [fullName, email, dob, contact, address, "admin123"]; // Replace with hashed password if needed

    } else {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
