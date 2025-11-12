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
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      lat,
      lng,
      address,
      description,
      occurred_at,
      contact,
      source,
      created_by,
      severity
    } = body;

    // Validate required fields
    if (!lat || !lng) {
      return NextResponse.json({
        success: false,
        message: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coordinates provided'
      }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Insert the alert into the database
      const insertQuery = `
        INSERT INTO alerts (
          type, 
          lat, 
          lng, 
          address, 
          description, 
          occurred_at, 
          contact, 
          severity,
          status,
          is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        type || 'Emergency',
        latitude,
        longitude,
        address || `Lat: ${latitude}, Lng: ${longitude}`,
        description || 'Emergency SMS Alert',
        occurred_at || new Date().toISOString(),
        contact,
        severity || 'medium',
        'Not Responded', // Default status for unverified alerts
        false      // Not verified yet
      ];

      const result = await client.query(insertQuery, values);
      const newAlert = result.rows[0];

      console.log('SMS Alert created:', {
        id: newAlert.id,
        contact: contact,
        coordinates: `${latitude}, ${longitude}`,
        description: description
      });

      return NextResponse.json({
        success: true,
        message: 'Alert created successfully from SMS',
        alert: newAlert
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating SMS alert:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({
        success: false,
        message: 'Duplicate alert detected'
      }, { status: 409 });
    }
    
    if (error.code === '23502') { // Not null violation
      return NextResponse.json({
        success: false,
        message: 'Missing required field'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to create alert from SMS'
    }, { status: 500 });
  }
}
