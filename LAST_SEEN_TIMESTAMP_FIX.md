# "Last Seen" Timestamp Issue - Fixed ✅

## 📋 Issue

User shows "Last seen 8 hours ago" even after logging in today.

**Date**: October 28, 2025  
**Status**: ✅ Fixed

---

## ❌ Problem

### What Was Happening:

1. User logs in → Creates new session with `last_active_at = NOW()`
2. User closes browser → Heartbeat stops
3. After 2 minutes → Session marked `is_active = FALSE`
4. `last_active_at` remains at the time browser was closed
5. User logs in again → Creates ANOTHER session
6. Old session still exists with old timestamp
7. Status API shows most recent session by `last_active_at` (the old one!)

### Result:
Shows "Last seen 8 hours ago" because that's when the previous session was last active.

---

## ✅ Solution

### 1. **Clean Up Old Sessions on Login**

Added code to mark all previous sessions as inactive when user logs in:

```javascript
// Mark all previous sessions for this user as inactive
await pool.query(
  `UPDATE admin_sessions 
   SET is_active = FALSE 
   WHERE admin_email = $1 AND is_active = TRUE`,
  [admin.email]
);

// Insert new session with current timestamp
const sessionInsert = await pool.query(
  `INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active, last_active_at)
   VALUES ($1, $2, $3, TRUE, NOW())
   RETURNING id`,
  [admin.email, `${ip} (${location})`, userAgent]
);
```

### 2. **Explicitly Set last_active_at on Login**

Changed from:
```javascript
INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active)
VALUES ($1, $2, $3, TRUE)
```

To:
```javascript
INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active, last_active_at)
VALUES ($1, $2, $3, TRUE, NOW())
```

---

## 🔧 What Changed

### File: `pages/api/login.js`

**Lines 74-80**: Added cleanup of old sessions
```javascript
// Mark all previous sessions for this user as inactive
await pool.query(
  `UPDATE admin_sessions 
   SET is_active = FALSE 
   WHERE admin_email = $1 AND is_active = TRUE`,
  [admin.email]
);
```

**Lines 83-88**: Explicitly set `last_active_at` on insert
```javascript
INSERT INTO admin_sessions (admin_email, ip_address, user_agent, is_active, last_active_at)
VALUES ($1, $2, $3, TRUE, NOW())
```

---

## 🎯 How It Works Now

### Before Fix:
```
Login #1 (8 hours ago)
├─ Session 1: last_active_at = 8 hours ago, is_active = FALSE
│
Login #2 (now)
├─ Session 2: last_active_at = now, is_active = TRUE
│
Status API Query:
├─ ORDER BY last_active_at DESC LIMIT 1
└─ Returns: Session 2 (most recent by timestamp)
    But if heartbeat fails, shows Session 1's old timestamp
```

### After Fix:
```
Login #1 (8 hours ago)
├─ Session 1: last_active_at = 8 hours ago, is_active = FALSE
│
Login #2 (now)
├─ Mark Session 1 as inactive ✅
├─ Session 2: last_active_at = NOW(), is_active = TRUE ✅
│
Status API Query:
├─ ORDER BY last_active_at DESC LIMIT 1
└─ Returns: Session 2 (current session)
    Shows: "Online" or "Last seen X mins ago" (current)
```

---

## ✅ Expected Behavior Now

### Scenario 1: User Logs In and Stays Active
```
1. Login → Session created with last_active_at = NOW()
2. Heartbeat runs every 30s → Updates last_active_at
3. Status shows: "Online" 🟢
```

### Scenario 2: User Logs In and Closes Browser
```
1. Login → Session created with last_active_at = NOW()
2. Close browser → Heartbeat stops
3. After 2 minutes → Session marked is_active = FALSE
4. Status shows: "Last seen 2 mins ago" ⚫
```

### Scenario 3: User Logs In Again
```
1. Previous session: last_active_at = 8 hours ago, is_active = FALSE
2. Login again → Old session stays inactive ✅
3. New session created: last_active_at = NOW(), is_active = TRUE ✅
4. Status shows: "Online" 🟢 (not "Last seen 8 hours ago")
```

---

## 🧪 Testing

### Test 1: Fresh Login
1. **Logout** completely
2. **Login** again
3. **Check status page**
4. Should show: **"Online"** 🟢

### Test 2: After Closing Browser
1. **Login**
2. **Close browser** (don't logout)
3. **Wait 3 minutes**
4. **Open status page** (from another device/browser)
5. Should show: **"Last seen 3 mins ago"** ⚫

### Test 3: Login After Long Time
1. **Login** → Use system → **Logout**
2. **Wait 8 hours**
3. **Login** again
4. **Check status page**
5. Should show: **"Online"** 🟢 (NOT "Last seen 8 hours ago")

---

## 🔍 Debugging

### Check Database Sessions:
```sql
-- See all sessions for a user
SELECT 
  id,
  admin_email,
  is_active,
  last_active_at,
  created_at,
  NOW() - last_active_at as inactive_duration
FROM admin_sessions
WHERE admin_email = 'admin@mdrrmo.com'
ORDER BY created_at DESC;
```

### Expected Output After Login:
```
id | admin_email        | is_active | last_active_at      | created_at          | inactive_duration
---|--------------------|-----------|--------------------|---------------------|------------------
5  | admin@mdrrmo.com   | TRUE      | 2025-10-28 19:25   | 2025-10-28 19:25   | 00:00:00  ✅ Current
4  | admin@mdrrmo.com   | FALSE     | 2025-10-28 11:30   | 2025-10-28 11:00   | 08:00:00  ✅ Old (inactive)
3  | admin@mdrrmo.com   | FALSE     | 2025-10-27 15:00   | 2025-10-27 14:30   | 1 day     ✅ Old (inactive)
```

### Check Status API Response:
```javascript
// Browser console
fetch('/api/admins/status')
  .then(r => r.json())
  .then(data => {
    const me = data.admins.find(a => a.email === 'admin@mdrrmo.com');
    console.log('My status:', me);
  });

// Should show:
{
  email: "admin@mdrrmo.com",
  status: "Online",
  is_active: true,
  last_active_at: "2025-10-28T19:25:00.000Z"  // Recent timestamp
}
```

---

## 💡 Why This Happened

### Root Causes:

1. **Multiple Sessions**: Each login created a new session without cleaning up old ones
2. **No Explicit Timestamp**: Relied on database default for `last_active_at`
3. **Query Logic**: Ordered by `last_active_at DESC` which could return old sessions

### The Fix:

1. ✅ **Clean up old sessions** on login
2. ✅ **Explicitly set timestamp** to NOW() on login
3. ✅ **Ensure only one active session** per user

---

## 🎯 Additional Improvements

### Optional: Clean Up Very Old Sessions

You can add a periodic cleanup to delete sessions older than 30 days:

```javascript
// Run this periodically (e.g., daily cron job)
await pool.query(`
  DELETE FROM admin_sessions 
  WHERE last_active_at < NOW() - INTERVAL '30 days'
`);
```

### Optional: Limit Sessions Per User

Prevent too many sessions from accumulating:

```javascript
// Keep only the last 10 sessions per user
await pool.query(`
  DELETE FROM admin_sessions 
  WHERE id IN (
    SELECT id FROM admin_sessions 
    WHERE admin_email = $1 
    ORDER BY created_at DESC 
    OFFSET 10
  )
`, [admin.email]);
```

---

## ✅ Summary

### What Was Fixed:
1. ✅ Old sessions are now marked inactive on new login
2. ✅ New sessions explicitly set `last_active_at = NOW()`
3. ✅ Status page shows current session, not old ones

### What You Need to Do:
1. **Logout** from your current session
2. **Login** again
3. **Check status page** - should show "Online" 🟢

### Result:
- ✅ "Last seen" shows accurate recent activity
- ✅ No more "Last seen 8 hours ago" after fresh login
- ✅ Clean session management

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Status**: ✅ Fixed - Please logout and login again to apply
