# Live Status Update System

## Overview
This system provides real-time online/offline status tracking for admins and responders without requiring logout to update status.

## How It Works

### 1. **Heartbeat Mechanism**
- Every **30 seconds**, logged-in users send a heartbeat ping to the server
- The server updates the `last_active_at` timestamp in the session table
- Sessions are marked as **active** (`is_active = TRUE`)

### 2. **Automatic Offline Detection**
- If no heartbeat is received for **2 minutes**, the session is automatically marked as inactive
- The `/api/admins/status` endpoint runs cleanup on every call
- Users appear as "Offline" in the online users list

### 3. **Real-Time Updates**
- The `OnlineAdminsList` component polls `/api/admins/status` every **5 seconds**
- Status is calculated based on `last_active_at` timestamp
- No logout required - status updates automatically

## Components

### API Endpoints

#### `/api/heartbeat` (Admin)
- **Method**: POST
- **Purpose**: Updates admin session `last_active_at` timestamp
- **Called**: Every 30 seconds by logged-in admins

#### `/api/responders/heartbeat` (Responder)
- **Method**: POST
- **Purpose**: Updates responder session `last_active_at` timestamp
- **Called**: Every 30 seconds by logged-in responders

#### `/api/sessions/cleanup`
- **Method**: POST
- **Purpose**: Manually trigger cleanup of inactive sessions
- **Optional**: Can be called via cron job for additional cleanup

#### `/api/admins/status`
- **Method**: GET
- **Purpose**: Fetch all admins and responders with their current status
- **Auto-cleanup**: Runs cleanup before fetching status

### Client Components

#### `useHeartbeat` Hook
- **Location**: `/hooks/useHeartbeat.js`
- **Usage**: `useHeartbeat('admin', 30000)`
- **Parameters**:
  - `userType`: 'admin' or 'responder'
  - `interval`: Heartbeat interval in milliseconds (default: 30000)

#### Implementation in Dashboard
```javascript
import useHeartbeat from '@/hooks/useHeartbeat';

export default function DashboardContent({ user }) {
  useHeartbeat('admin', 30000); // Send heartbeat every 30 seconds
  // ... rest of component
}
```

## Database Schema

### `admin_sessions` Table
```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT REFERENCES admins(email) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);
```

### `responder_sessions` Table
```sql
CREATE TABLE responder_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responder_id INTEGER REFERENCES responders(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);
```

## Status Logic

### Online Status Criteria
A user is considered **Online** if:
1. `is_active = TRUE` in their session
2. `last_active_at` is within the last **2 minutes**

### Offline Status
A user is marked **Offline** if:
1. `is_active = FALSE`, OR
2. `last_active_at` is older than **2 minutes**

## Configuration

### Timing Parameters
- **Heartbeat Interval**: 30 seconds (configurable in `useHeartbeat` hook)
- **Inactive Timeout**: 2 minutes (configured in SQL queries)
- **Status Poll Interval**: 5 seconds (configured in `OnlineAdminsList` component)

### Customization
To adjust timing:
1. **Heartbeat frequency**: Change interval in `useHeartbeat('admin', 30000)`
2. **Inactive timeout**: Update `INTERVAL '2 minutes'` in SQL queries
3. **Status refresh**: Change interval in `OnlineAdminsList` component

## Visual Enhancements

### 1. **Pulse Animation** 🎯
- Online status indicators have a pulsing green animation
- Makes it immediately obvious who is currently active
- Uses Tailwind's `animate-ping` for smooth effect

### 2. **Last Seen Timestamp** 🕐
- Offline users show "Last seen X mins/hours/days ago"
- Helps track when users were last active
- Automatically formats relative time

### 3. **Notification Sound** 🔔
- Plays a sound when someone comes online
- Uses `/notification.mp3` audio file
- Volume set to 50% to avoid being intrusive

### 4. **Online Count Badge** 🔢
- Shows "X Online" badge for admins
- Shows "X Active" badge for responders
- Real-time count updates every 5 seconds
- Color-coded badges (green for admins, blue for responders)

## Benefits

✅ **No logout required** - Status updates automatically  
✅ **Real-time accuracy** - Updates every 5 seconds  
✅ **Automatic cleanup** - Inactive sessions marked offline  
✅ **Low overhead** - Lightweight heartbeat pings  
✅ **Scalable** - Works with multiple concurrent users  
✅ **Visual feedback** - Pulse animations and count badges  
✅ **Audio alerts** - Sound notification when users come online  
✅ **Last seen info** - Track when offline users were last active  

## Troubleshooting

### User shows as offline but is logged in
- Check browser console for heartbeat errors
- Verify `/api/heartbeat` endpoint is accessible
- Check if JWT token is valid

### Status not updating
- Verify `OnlineAdminsList` is polling correctly
- Check database `last_active_at` timestamps
- Ensure cleanup queries are running

### Performance concerns
- Heartbeat is a simple UPDATE query (very fast)
- Consider increasing heartbeat interval if needed
- Status polling can be adjusted per component
