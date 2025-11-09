import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export async function GET(request) {
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

    // Fetch all unverified alerts
    const result = await pool.query(
      `SELECT 
        a.id,
        a.user_id,
        a.address,
        a.type,
        a.status,
        a.occurred_at,
        a.lat,
        a.lng,
        a.description,
        a.severity,
        a.is_verified,
        u.name as resident_name,
        u.contact as resident_contact
      FROM alerts a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_verified = FALSE OR a.is_verified IS NULL
      ORDER BY a.occurred_at DESC`
    );

    return NextResponse.json({
      success: true,
      alerts: result.rows,
    });
  } catch (error) {
    console.error('Error fetching unverified alerts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
