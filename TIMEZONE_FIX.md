# Timezone Fix - MDRRMO Dashboard

This document explains the timezone issues that were identified and fixed in the MDRRMO Dashboard system.

## Problem Statement

The MDRRMO Dashboard was experiencing timezone inconsistencies where:
- Timestamps were displaying incorrect times
- Date/time calculations were off by several hours
- Notifications showed wrong relative times (e.g., "5 hours ago" instead of "just now")
- Database timestamps didn't match the local timezone (Asia/Manila)

## Root Cause

The application was using mixed timezone handling:
1. **Database**: PostgreSQL was storing timestamps in UTC
2. **Server**: Node.js was using the system timezone
3. **Client**: Browser was using the user's local timezone
4. **No Standardization**: Different parts of the code were handling timezones differently

## Solution Implemented

### 1. Database Configuration

Set PostgreSQL to use Asia/Manila timezone:

```sql
-- Set timezone for the database
ALTER DATABASE mdrrmo_db SET timezone TO 'Asia/Manila';

-- Verify timezone setting
SHOW timezone;
```

### 2. Server-Side Timezone Handling

All server-side date operations now use Asia/Manila timezone:

```javascript
// Example: Getting current time in Asia/Manila
const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

// Example: Formatting dates for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### 3. Client-Side Timezone Handling

Updated all client-side date formatting to use Asia/Manila timezone:

```javascript
// In components/Notifications.js
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const dateManila = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const now = new Date();
  const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  
  const diffMs = nowManila - dateManila;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  // ... more formatting logic
};
```

### 4. Database Queries

Updated all database queries to handle timezone properly:

```sql
-- Use NOW() for current timestamp (respects database timezone)
UPDATE admins SET last_activity = NOW() WHERE id = $1;

-- Use INTERVAL for time calculations
SELECT * FROM alerts 
WHERE occurred_at > NOW() - INTERVAL '5 minutes';

-- Use AT TIME ZONE for explicit timezone conversion
SELECT 
  id,
  occurred_at AT TIME ZONE 'Asia/Manila' as local_time
FROM alerts;
```

## Files Modified

### API Routes
- `pages/api/heartbeat.js` - Updated timestamp handling
- `pages/api/login.js` - Fixed login timestamp
- `pages/api/logout.js` - Fixed logout timestamp
- `pages/api/admins/status.js` - Fixed online status calculation
- `pages/api/responders/heartbeat.js` - Updated responder heartbeat
- `pages/api/sessions/cleanup.js` - Fixed session cleanup intervals

### Components
- `components/Notifications.js` - Fixed relative time display
- `components/OnlineAdminsList.js` - Fixed last activity display
- `components/Alerts.js` - Fixed alert timestamp display
- `components/Logs.js` - Fixed log timestamp display

### Utilities
- Created timezone utility functions for consistent handling

## Testing

### Verify Database Timezone

```sql
-- Check database timezone
SHOW timezone;
-- Should return: Asia/Manila

-- Test timestamp insertion
INSERT INTO test_table (created_at) VALUES (NOW());
SELECT created_at FROM test_table ORDER BY id DESC LIMIT 1;
-- Should show current Asia/Manila time
```

### Verify Application Timezone

```javascript
// In browser console
console.log(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
// Should show current Manila time

// Test relative time
const testDate = new Date();
console.log(formatRelativeTime(testDate.toISOString()));
// Should show "just now"
```

## Migration Steps

If you have existing data with incorrect timezones:

### 1. Backup Database
```bash
pg_dump mdrrmo_db > backup_before_timezone_fix.sql
```

### 2. Update Database Timezone
```sql
ALTER DATABASE mdrrmo_db SET timezone TO 'Asia/Manila';
```

### 3. Restart Database Connection
```bash
# Restart your application to pick up new timezone settings
pm2 restart mdrrmo-dashboard
# or
npm run dev
```

### 4. Verify Timestamps
```sql
-- Check recent timestamps
SELECT id, created_at, occurred_at 
FROM alerts 
ORDER BY occurred_at DESC 
LIMIT 10;

-- Verify they match current Manila time
SELECT NOW();
```

## Common Issues and Solutions

### Issue 1: Times Still Showing Wrong
**Cause**: Browser cache or old data
**Solution**: 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Restart the application

### Issue 2: Database Timezone Not Persisting
**Cause**: Timezone set at session level instead of database level
**Solution**:
```sql
-- Set at database level (persists)
ALTER DATABASE mdrrmo_db SET timezone TO 'Asia/Manila';

-- Not at session level (temporary)
-- SET timezone TO 'Asia/Manila'; -- Don't use this
```

### Issue 3: Inconsistent Times Across Pages
**Cause**: Some components not using timezone utility
**Solution**: Ensure all date formatting uses the standardized timezone handling

### Issue 4: Relative Times Negative or Future
**Cause**: Timezone conversion creating time differences
**Solution**: Always convert both dates to same timezone before comparison

## Best Practices

### 1. Always Use Timezone-Aware Functions
```javascript
// Good
const date = new Date(dateString);
const manilaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));

// Bad
const date = new Date(dateString); // Uses system timezone
```

### 2. Use NOW() in Database Queries
```sql
-- Good
INSERT INTO logs (created_at) VALUES (NOW());

-- Bad
-- Let application send timestamp (may have wrong timezone)
```

### 3. Consistent Formatting
```javascript
// Create a utility function for consistent formatting
const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### 4. Document Timezone Assumptions
Always document which timezone is being used in comments:

```javascript
// All timestamps are in Asia/Manila timezone
const lastActivity = user.last_activity;
```

## Verification Checklist

- [x] Database timezone set to Asia/Manila
- [x] All API endpoints use consistent timezone
- [x] Client-side formatting uses Asia/Manila
- [x] Relative time calculations are accurate
- [x] Notification timestamps are correct
- [x] Alert timestamps display correctly
- [x] Login/logout times are accurate
- [x] Session timeout calculations work properly
- [x] Online status detection is accurate

## Impact

After implementing this fix:
- ✅ All timestamps now display in Asia/Manila timezone
- ✅ Relative times (e.g., "5 mins ago") are accurate
- ✅ Session timeouts work correctly
- ✅ Online/offline status is accurate
- ✅ Notification times are correct
- ✅ Consistent timezone across all features

## Notes

- The Philippines uses Asia/Manila timezone (UTC+8)
- No daylight saving time in the Philippines
- All timestamps in the database are stored with timezone awareness
- Client browsers may be in different timezones, but all times are converted to Asia/Manila for display

## References

- [PostgreSQL Timezone Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [JavaScript Date and Timezone Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Intl.DateTimeFormat API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
