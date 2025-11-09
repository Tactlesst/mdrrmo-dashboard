import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export async function POST(request) {
  try {
    // Verify admin authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const token = cookies.auth;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { alertId, isApproved, notes } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { success: false, message: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Get admin ID from database
    const adminResult = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [user.email]
    );
    
    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }

    const adminId = adminResult.rows[0].id;

    if (isApproved) {
      // Approve and verify the alert
      await pool.query(
        `UPDATE alerts 
         SET is_verified = TRUE,
             verified_by = $1,
             verified_at = NOW(),
             verification_notes = $2,
             status = CASE 
               WHEN status = 'Not Responded' THEN 'Pending'
               ELSE status
             END
         WHERE id = $3`,
        [adminId, notes || null, alertId]
      );

      // Get alert details for notification
      const alertResult = await pool.query(
        `SELECT a.*, u.name as resident_name 
         FROM alerts a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = $1`,
        [alertId]
      );

      if (alertResult.rows.length > 0) {
        const alert = alertResult.rows[0];
        
        // Create notification for all online responders
        await pool.query(
          `INSERT INTO notifications 
           (account_type, account_id, sender_type, sender_id, sender_name, recipient_name, message, is_read)
           SELECT 
             'responder',
             r.id,
             'alerts1',
             $1,
             'MDRRMO Alert System',
             r.name,
             $2,
             FALSE
           FROM responders r
           INNER JOIN responder_sessions rs ON r.id = rs.responder_id
           WHERE rs.is_active = TRUE 
             AND rs.status IN ('online', 'ready to go', 'standby')`,
          [
            adminId,
            `🚨 VERIFIED EMERGENCY: ${alert.type || 'Incident'} at ${alert.address || 'Unknown location'}. Resident: ${alert.resident_name || 'Unknown'}. Immediate response required!`
          ]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Incident verified and sent to responders',
      });
    } else {
      // Reject the alert - mark as verified but with rejected status
      await pool.query(
        `UPDATE alerts 
         SET is_verified = TRUE,
             verified_by = $1,
             verified_at = NOW(),
             verification_notes = $2,
             status = 'Rejected'
         WHERE id = $3`,
        [adminId, notes || 'Incident rejected during verification', alertId]
      );

      return NextResponse.json({
        success: true,
        message: 'Incident rejected',
      });
    }
  } catch (error) {
    console.error('Error verifying alert:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
