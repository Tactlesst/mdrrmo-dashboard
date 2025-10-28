import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify JWT token
  const token = req.cookies.auth;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch authenticated user
    let user;
    let type;
    const adminRes = await pool.query(
      'SELECT id, name FROM admins WHERE id = $1',
      [decoded.id]
    );
    if (adminRes.rows.length > 0) {
      user = adminRes.rows[0];
      type = 'admin';
    } else {
      const responderRes = await pool.query(
        'SELECT id, name FROM responders WHERE id = $1',
        [decoded.id]
      );
      if (responderRes.rows.length > 0) {
        user = responderRes.rows[0];
        type = 'responder';
      }
    }

    if (!user) return res.status(404).json({ message: 'Authenticated user not found' });

    const { id, name, email, contact, dob, address, role } = req.body;

    // Validation: Required fields
    if (!id || !name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validation: Name length
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    // Validation: Role validation
    const validRoles = ['Residents', 'Responders', 'Co-Admins'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Determine target table
    let table = '';
    let targetRole = '';
    if (role === 'Residents') {
      table = 'users';
      targetRole = 'Resident';
    } else if (role === 'Responders') {
      table = 'responders';
      targetRole = 'Responder';
    } else if (role === 'Co-Admins') {
      table = 'admins';
      targetRole = 'Co-Admin';
    }

    // Validation: Check for duplicate email (different user in same role)
    const duplicateCheck = await pool.query(
      `SELECT id FROM ${table} WHERE email = $1 AND id != $2`,
      [email, id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered to another user in this role' });
    }

    // Validation: Cross-table email check
    const crossCheckQueries = [];
    if (role !== 'Residents') {
      crossCheckQueries.push(pool.query("SELECT id FROM users WHERE email = $1", [email]));
    }
    if (role !== 'Responders') {
      crossCheckQueries.push(pool.query("SELECT id FROM responders WHERE email = $1", [email]));
    }
    if (role !== 'Co-Admins') {
      crossCheckQueries.push(pool.query("SELECT id FROM admins WHERE email = $1", [email]));
    }

    const crossCheckResults = await Promise.all(crossCheckQueries);
    for (let i = 0; i < crossCheckResults.length; i++) {
      if (crossCheckResults[i].rows.length > 0) {
        const existingRole = role === 'Residents' ? 
          (i === 0 ? 'Responder' : 'Admin') : 
          (role === 'Responders' ? (i === 0 ? 'Resident' : 'Admin') : 
          (i === 0 ? 'Resident' : 'Responder'));
        return res.status(409).json({ message: `Email already registered as ${existingRole}` });
      }
    }

    const result = await pool.query(
      `
      UPDATE ${table}
      SET name = $1, email = $2, contact = $3, dob = $4, address = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, email, contact, dob, address
      `,
      [name, email, contact || '', dob || null, address || '', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Insert notification
    const isAdminTarget = role === 'Co-Admins';
    const notifAccountType = isAdminTarget ? 'admin' : type;
    const notifAccountId = isAdminTarget ? id : user.id;
    const notifSenderType = isAdminTarget ? 'system' : type;
    const notifSenderId = isAdminTarget ? null : user.id;
    const notifSenderName = isAdminTarget ? 'System' : (user.name || 'Unknown');
    const notifRecipientName = isAdminTarget ? name : (user.name || 'Unknown');
    const actionText = isAdminTarget
      ? `System: Admin ${user.name || 'Unknown'} edited Co-Admin ${name}`
      : `${type.charAt(0).toUpperCase() + type.slice(1)} ${user.name || 'Unknown'} updated ${targetRole} ${name}`;

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
        `${actionText} on ${new Date().toLocaleString('en-PH', {
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

    return res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    logger.error('Update error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}