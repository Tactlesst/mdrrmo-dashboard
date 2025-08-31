// pages/api/alerts/analytics.js
import pool from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. Group by type (for Pie Chart)
    const typeStatsQuery = await pool.query(`
      SELECT type, COUNT(*) AS total
      FROM alerts
      GROUP BY type
      ORDER BY total DESC
    `);

    // 2. Group by day (for Line Chart)
    const dailyStatsQuery = await pool.query(`
      SELECT TO_CHAR(occurred_at::date, 'YYYY-MM-DD') AS date,
             COUNT(*) AS total
      FROM alerts
      GROUP BY date
      ORDER BY date ASC
    `);

    res.status(200).json({
      typeStats: typeStatsQuery.rows,
      dailyStats: dailyStatsQuery.rows,
    });
  } catch (err) {
    console.error("Error fetching alert analytics:", err);
    res.status(500).json({ error: "Database error fetching analytics" });
  }
}
