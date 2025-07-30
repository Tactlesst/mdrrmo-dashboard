import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [residents, responders, coAdmins] = await Promise.all([
      sql`SELECT name AS "fullName", email, '1995-01-01'::DATE as dob, '09170000000' as contact, 'Balingasag' as address FROM users`, // Simulated Residents
      sql`SELECT name AS "fullName", email, '1990-01-01'::DATE as dob, '09220000000' as contact, 'Balingasag' as address FROM responders`,
      sql`SELECT name AS "fullName", email, '1985-01-01'::DATE as dob, '09330000000' as contact, 'Misamis Oriental' as address FROM admins`,
    ]);

    res.status(200).json({
      Residents: residents,
      Responders: responders,
      'Co-Admins': coAdmins,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
