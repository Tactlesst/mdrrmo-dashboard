# Last Seen Status - Debugging Guide ✅

## 📋 Issue

The "Last seen" timestamp is not showing or updating for offline users in the OnlineAdminsList component.

**Date**: October 28, 2025  
**Status**: 🔍 Debugging Added

---

## 🔍 What I Added

### Debug Logs in `OnlineAdminsList.js`

#### 1. **API Response Logging** (Line 30)
```javascript
const data = await res.json();
console.log('Status API Response:', data); // Debug log
```

#### 2. **Last Active Logging** (Lines 62-63, 75)
```javascript
if (!lastActiveAt) {
  console.log('No lastActiveAt provided');
  return null;
}

console.log('Last Active:', lastActiveAt, 'Diff mins:', diffMins); // Debug log
```

---

## 🧪 How to Debug

### Step 1: Open Browser Console
1. Open your dashboard
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Go to the **Admin Status** page

### Step 2: Check API Response
Look for logs like:
```javascript
Status API Response: {
  admins: [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "Offline",
      last_active_at: "2025-10-28T11:00:00.000Z"  // ← Check if this exists
    }
  ],
  responders: [...]
}
```

### Step 3: Check Last Seen Calculation
Look for logs like:
```javascript
Last Active: 2025-10-28T11:00:00.000Z Diff mins: 15
```

---

## ❓ Possible Issues & Solutions

### Issue 1: `last_active_at` is `null`
**Symptom**: Console shows `No lastActiveAt provided`

**Cause**: No session record in database

**Solution**: 
1. Make sure you've logged in at least once
2. Check if `admin_sessions` table has records:
```sql
SELECT * FROM admin_sessions WHERE admin_email = 'your-email@example.com';
```

3. If no records, the login might not be creating sessions. Check `/api/login`:
```javascript
// Should create session on login
await pool.query(
  'INSERT INTO admin_sessions (admin_email, is_active, last_active_at) VALUES ($1, TRUE, NOW())',
  [email]
);
```

### Issue 2: `last_active_at` exists but not showing
**Symptom**: Console shows the timestamp but no "Last seen" text

**Cause**: User might still be showing as "Online"

**Solution**: 
- "Last seen" only shows for **Offline** users
- Check if `status` is "Offline":
```javascript
{user.status?.toLowerCase() === 'offline' && user.last_active_at && (
  <span>Last seen {formatLastSeen(user.last_active_at)}</span>
)}
```

### Issue 3: Time calculation is wrong
**Symptom**: Shows wrong time (e.g., "5000 mins ago")

**Cause**: Timezone mismatch or invalid date format

**Solution**:
- Check if `last_active_at` is in ISO format
- Verify database timezone settings
- Check console for the calculated diff

### Issue 4: Not updating in real-time
**Symptom**: Shows same time even after waiting

**Cause**: Component not re-rendering or polling stopped

**Solution**:
- Check if polling is active (should fetch every 5 seconds)
- Look for network requests to `/api/admins/status` in Network tab
- Verify `setInterval` is running

---

## ✅ Expected Behavior

### When Everything Works:

#### Console Output:
```javascript
// Every 5 seconds:
Status API Response: { admins: [...], responders: [...] }

// For each offline user:
Last Active: 2025-10-28T11:00:00.000Z Diff mins: 15
```

#### UI Display:
```
┌─────────────────────────┐
│ 👤 John Doe             │
│ john@example.com        │
│                         │
│ ⚫ Offline               │
│    Last seen 15 mins ago│  ← This should show
│                  [Chat] │
└─────────────────────────┘
```

---

## 🔧 Quick Fixes

### Fix 1: Ensure Sessions Are Created on Login

Check `pages/api/login.js`:
```javascript
// After successful login, create session
const sessionResult = await pool.query(
  `INSERT INTO admin_sessions (admin_email, is_active, last_active_at, ip_address, user_agent)
   VALUES ($1, TRUE, NOW(), $2, $3)
   RETURNING id`,
  [email, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
);
```

### Fix 2: Verify Heartbeat is Running

Check browser console for:
```javascript
// Should see POST requests every 30 seconds
POST /api/heartbeat
Status: 200 OK
```

### Fix 3: Check Database Schema

Verify tables exist:
```sql
-- Admin sessions
SELECT * FROM admin_sessions LIMIT 5;

-- Responder sessions
SELECT * FROM responder_sessions LIMIT 5;
```

---

## 📊 Database Queries for Debugging

### Check if sessions exist:
```sql
SELECT 
  admin_email, 
  is_active, 
  last_active_at,
  NOW() - last_active_at as inactive_duration
FROM admin_sessions
ORDER BY last_active_at DESC;
```

### Check if cleanup is working:
```sql
-- Should mark inactive sessions as FALSE
SELECT 
  admin_email,
  is_active,
  last_active_at,
  CASE 
    WHEN last_active_at < NOW() - INTERVAL '2 minutes' THEN 'Should be inactive'
    ELSE 'Should be active'
  END as expected_status
FROM admin_sessions;
```

### Manually test the query:
```sql
-- Same query as API
SELECT 
  a.id,
  a.name,
  a.email,
  COALESCE(s.is_active, false) AS is_active,
  s.last_active_at,
  CASE 
    WHEN s.is_active THEN 'Online' 
    ELSE 'Offline' 
  END AS status
FROM admins a
LEFT JOIN LATERAL (
  SELECT is_active, last_active_at
  FROM admin_sessions
  WHERE admin_email = a.email
  ORDER BY last_active_at DESC
  LIMIT 1
) s ON true;
```

---

## 🎯 Testing Steps

### Test 1: Login and Check Session
1. Login to dashboard
2. Open database and run:
```sql
SELECT * FROM admin_sessions WHERE admin_email = 'your-email';
```
3. Should see a record with `is_active = TRUE` and recent `last_active_at`

### Test 2: Check Heartbeat
1. Stay logged in
2. Open DevTools → Network tab
3. Look for POST `/api/heartbeat` every 30 seconds
4. Check database - `last_active_at` should update

### Test 3: Go Offline
1. Close browser or stop heartbeat
2. Wait 2+ minutes
3. Check database:
```sql
SELECT is_active, last_active_at FROM admin_sessions WHERE admin_email = 'your-email';
```
4. Should show `is_active = FALSE`

### Test 4: Check UI
1. Open status page on another device/browser
2. Should see user as "Offline"
3. Should see "Last seen X mins ago"

---

## 📝 What to Look For in Console

### Good Output:
```javascript
Status API Response: {
  admins: [
    {
      id: 1,
      name: "John",
      status: "Offline",
      last_active_at: "2025-10-28T11:00:00.000Z"  ✅
    }
  ]
}

Last Active: 2025-10-28T11:00:00.000Z Diff mins: 15  ✅
```

### Bad Output:
```javascript
Status API Response: {
  admins: [
    {
      id: 1,
      name: "John",
      status: "Offline",
      last_active_at: null  ❌ Problem!
    }
  ]
}

No lastActiveAt provided  ❌ Problem!
```

---

## 🔗 Related Files

- **`components/OnlineAdminsList.js`** - UI component (now with debug logs)
- **`pages/api/admins/status.js`** - API endpoint (returns last_active_at)
- **`pages/api/heartbeat.js`** - Updates last_active_at
- **`pages/api/login.js`** - Should create initial session

---

## ✅ Next Steps

1. **Open your dashboard**
2. **Open browser console** (F12)
3. **Go to Admin Status page**
4. **Check console logs** for the debug output
5. **Share the console output** if you need help

The debug logs will tell us exactly what data is being received and why "Last seen" might not be showing!

---

**Last Updated**: October 28, 2025  
**Status**: 🔍 Debug Mode Active
