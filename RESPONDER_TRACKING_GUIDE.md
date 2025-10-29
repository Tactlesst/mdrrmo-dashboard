# Responder Tracking System - Implementation Guide

## Overview

This system enables real-time tracking of emergency responders using GPS location from their mobile devices. The dashboard displays responder locations on a map, showing their routes to incidents and current status.

## Architecture

### Components

1. **Mobile App (React Native/Expo)**
   - Location tracking service
   - Automatic background location updates
   - Integration with alert assignments

2. **Backend API (Next.js)**
   - Location update endpoints
   - Real-time responder tracking queries
   - Location history storage

3. **Dashboard (Next.js/React)**
   - Live responder map visualization
   - Alert integration with responder locations
   - Route tracking and ETA calculations

## Database Schema

### New Tables

#### `responder_sessions` (Enhanced)
```sql
ALTER TABLE responder_sessions ADD COLUMN:
- current_latitude DECIMAL(10, 8)
- current_longitude DECIMAL(11, 8)
- heading DECIMAL(5, 2)
- speed DECIMAL(6, 2)
- accuracy DECIMAL(8, 2)
- location_updated_at TIMESTAMP
- assigned_alert_id INTEGER
- destination_latitude DECIMAL(10, 8)
- destination_longitude DECIMAL(11, 8)
- route_started_at TIMESTAMP
- estimated_arrival TIMESTAMP
```

#### `responder_location_history` (New)
```sql
CREATE TABLE responder_location_history (
    id SERIAL PRIMARY KEY,
    responder_id INTEGER REFERENCES responders(id),
    session_id UUID REFERENCES responder_sessions(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    accuracy DECIMAL(8, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alert_id INTEGER REFERENCES alerts(id)
);
```

## API Endpoints

### 1. Update Responder Location
**POST** `/api/responders/location`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 8.7434,
  "longitude": 124.7763,
  "heading": 45.5,
  "speed": 15.2,
  "accuracy": 10.5,
  "alertId": 123,
  "destinationLatitude": 8.7500,
  "destinationLongitude": 124.7800
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "responderId": 5,
    "sessionId": "uuid",
    "latitude": 8.7434,
    "longitude": 124.7763,
    "alertId": 123
  }
}
```

### 2. Get Active Responder Locations
**GET** `/api/responders/tracking?alertId=123`

**Response:**
```json
{
  "success": true,
  "responders": [
    {
      "responderId": 5,
      "responderName": "John Doe",
      "email": "john@example.com",
      "contact": "+1234567890",
      "sessionId": "uuid",
      "location": {
        "latitude": 8.7434,
        "longitude": 124.7763,
        "heading": 45.5,
        "speed": 15.2,
        "accuracy": 10.5,
        "updatedAt": "2025-01-29T12:00:00Z"
      },
      "assignment": {
        "alertId": 123,
        "destination": {
          "latitude": 8.7500,
          "longitude": 124.7800
        },
        "alertLocation": {
          "latitude": 8.7500,
          "longitude": 124.7800
        },
        "address": "123 Main St",
        "type": "Car Accident",
        "routeStartedAt": "2025-01-29T11:55:00Z"
      },
      "status": "online",
      "lastActiveAt": "2025-01-29T12:00:00Z"
    }
  ],
  "count": 1
}
```

### 3. Get Location History (Route Trail)
**GET** `/api/responders/route-history?responderId=5&limit=100`

**Query Parameters:**
- `responderId` - Filter by responder ID
- `sessionId` - Filter by session ID
- `alertId` - Filter by alert ID
- `limit` - Number of records (default: 100)

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "responderId": 5,
      "responderName": "John Doe",
      "sessionId": "uuid",
      "latitude": 8.7434,
      "longitude": 124.7763,
      "heading": 45.5,
      "speed": 15.2,
      "accuracy": 10.5,
      "recordedAt": "2025-01-29T12:00:00Z",
      "alertId": 123
    }
  ],
  "count": 1
}
```

## Mobile App Integration

### Location Tracking Service

The mobile app uses `expo-location` for GPS tracking:

```javascript
import locationTrackingService from '@/services/locationTracking';

// Start tracking when user logs in
await locationTrackingService.startTracking();

// Set destination when responding to alert
locationTrackingService.setDestination(alertId, latitude, longitude);

// Stop tracking on logout
await locationTrackingService.stopTracking();
```

### Features

1. **Automatic Background Tracking**
   - Updates every 10 seconds or 10 meters
   - Continues in background (with permissions)
   - Sends location to server automatically

2. **Alert Assignment**
   - Links location updates to specific alerts
   - Tracks route to incident
   - Stores destination coordinates

3. **Manual Toggle**
   - Users can enable/disable tracking
   - Status indicator in UI
   - Persists across app restarts

## Dashboard Components

### ResponderTrackingMap
Displays all active responders on a map with:
- Real-time location updates (every 5 seconds)
- Direction indicators (heading)
- Speed display
- Route lines to destinations
- Status colors (green=active, gray=inactive)

### ResponderTracking
Full-page tracking interface with:
- Live map view
- Responder list sidebar
- Status indicators
- Distance calculations
- Assignment details

### AlertsMap (Enhanced)
Shows both alerts and responding responders:
- Alert markers (red/orange based on status)
- Responder markers (green/gray based on status)
- Integrated popups with details
- Auto-updates every 10 seconds

## Setup Instructions

### 1. Database Migration

Run the migration script:
```bash
psql -U your_user -d your_database -f migrations/add_responder_location_tracking.sql
```

### 2. Mobile App Configuration

Ensure location permissions in `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to track emergency responses."
        }
      ]
    ]
  }
}
```

### 3. Environment Variables

Add to `.env`:
```
JWT_SECRET=your_secret_key
```

### 4. Deploy API Endpoints

The following files need to be deployed:
- `/pages/api/responders/location.js`
- `/pages/api/responders/tracking.js`
- `/pages/api/responders/route-history.js`

### 5. Add Dashboard Pages

Import components in your dashboard:
```javascript
import ResponderTracking from '@/components/ResponderTracking';
import ResponderTrackingMap from '@/components/ResponderTrackingMap';
```

## Usage

### For Responders (Mobile App)

1. **Login** to the mobile app
2. **Enable location tracking** from the home screen
3. **Respond to alerts** - location automatically links to the alert
4. **View status** - tracking indicator shows active/inactive state

### For Dispatchers (Dashboard)

1. **View all responders** at `/responder-tracking` page
2. **Monitor specific alert** - responders assigned to alert shown on alert map
3. **Track routes** - see breadcrumb trail of responder movement
4. **Calculate ETA** - distance and speed shown for active responses

## Security Considerations

1. **Authentication Required**
   - All location endpoints require valid JWT token
   - Token verified on each request

2. **Data Privacy**
   - Location data only stored for active sessions
   - Historical data can be purged after incidents resolved
   - Access restricted to authenticated users

3. **Rate Limiting**
   - Mobile app updates every 10 seconds
   - Dashboard polls every 5-10 seconds
   - Consider implementing rate limits on API

## Performance Optimization

1. **Database Indexes**
   - Indexes on `responder_id`, `session_id`, `alert_id`
   - Spatial indexes for location queries

2. **Caching**
   - Consider Redis for active responder locations
   - Cache frequently accessed routes

3. **Mobile Battery**
   - Configurable update intervals
   - Accuracy settings based on needs
   - Option to disable background tracking

## Troubleshooting

### Location Not Updating

1. Check mobile app permissions
2. Verify network connectivity
3. Check JWT token validity
4. Review server logs for errors

### Markers Not Showing on Map

1. Verify coordinates are valid
2. Check API response format
3. Ensure Leaflet loaded correctly
4. Check browser console for errors

### High Battery Drain

1. Increase update interval
2. Reduce accuracy requirement
3. Disable background tracking when not needed

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for instant updates
   - Push notifications for location changes

2. **Route Optimization**
   - Integration with mapping APIs
   - Traffic-aware routing
   - Multiple responder coordination

3. **Analytics**
   - Response time analysis
   - Coverage area heatmaps
   - Performance metrics

4. **Geofencing**
   - Alert when responder enters/exits areas
   - Automatic status updates
   - Zone-based assignments

## Support

For issues or questions:
1. Check server logs: `/var/log/app.log`
2. Review mobile app console
3. Test API endpoints with Postman
4. Verify database connections

## License

This implementation is part of the MDRRMO Dashboard system.
