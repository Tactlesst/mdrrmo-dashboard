import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const client = await pool.connect();
  
  try {
    const { alertId, authority, notes, referredBy } = await request.json();

    // Validate input
    if (!alertId || !authority) {
      return NextResponse.json(
        { success: false, message: 'Alert ID and authority are required' },
        { status: 400 }
      );
    }

    try {
      await client.query('BEGIN');

      // Get alert details
      const alertResult = await client.query(
        'SELECT * FROM alerts WHERE id = $1',
        [alertId]
      );

      if (alertResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Alert not found' },
          { status: 404 }
        );
      }

      const alert = alertResult.rows[0];

      // Insert referral record
      await client.query(
        `INSERT INTO alert_referrals 
        (alert_id, referred_to_authority, referred_by, referral_notes, referred_at, alert_type, alert_address) 
        VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
        [alertId, authority, referredBy || null, notes || null, alert.type, alert.address]
      );

      // Update alert status to indicate it's been referred
      await client.query(
        `UPDATE alerts 
        SET status = 'Referred', 
            referred_to = $1,
            referred_by = $2,
            referred_at = NOW()
        WHERE id = $3`,
        [authority, referredBy || null, alertId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Incident successfully referred',
        referredTo: authority
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error referring alert:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refer incident: ' + error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
