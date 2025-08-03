// Example for Next.js API route
import db from '@/lib/db'; // Replace with your database instance

export default async function handler(req, res) {
  try {
    const cities = await db.query(`
      SELECT DISTINCT name 
      FROM municipalities 
      ORDER BY name ASC
    `); // Adjust if your table is named differently

    res.status(200).json(cities.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}
