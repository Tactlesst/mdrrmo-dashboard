# Fix Duplicate Notifications - Quick Guide

## The Problem You're Seeing

Your screenshot shows **6 notifications** for the **same alert** (`b3c2c6a4-6f6c-4fee-8e9c-a3e7972e6cc8`):
- Row 1: account_id = 1
- Row 2: account_id = 3
- Row 3: account_id = 4
- Row 4: account_id = 5
- Row 5: account_id = 6
- Row 6: account_id = 7

**This is WRONG!** You should have **only 1 notification** per alert, not 6.

---

## Why This Happened

The **old code** was still running when those notifications were created. The old code did this:

```sql
-- OLD CODE (WRONG) - Creates one notification per admin
INSERT INTO alert_notifications (...)
SELECT ..., a.id, a.name, ...
FROM admins a
-- Result: 6 admins = 6 notifications ❌
```

The **new code** (already fixed) does this:

```sql
-- NEW CODE (CORRECT) - Creates one broadcast notification
INSERT INTO alert_notifications (...)
VALUES (..., firstAdmin.id, 'All Admins', ...)
-- Result: 6 admins = 1 notification ✅
```

---

## How to Fix It (3 Steps)

### Step 1: Clean Up Old Duplicates

Run this SQL script to delete duplicate notifications:

```bash
psql -U your_username -d your_database -f database/migrations/cleanup_all_duplicate_notifications.sql
```

**Or manually in pgAdmin/database tool:**

```sql
-- Delete duplicates, keep only the oldest notification per alert
DELETE FROM alert_notifications
WHERE id NOT IN (
    SELECT MIN(id)
    FROM alert_notifications
    GROUP BY alert_id
);

-- Update recipient names
UPDATE alert_notifications
SET recipient_name = 'All Admins'
WHERE account_type = 'admin';
```

---

### Step 2: Restart Your Server

The code has been fixed, but you need to restart the server to use the new code:

**For Netlify Functions:**
```bash
# Redeploy your functions
netlify deploy --prod
```

**For Local Development:**
```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

---

### Step 3: Test with a New Alert

1. **Create a NEW alert** from the mobile app
2. **Check the database:**
   ```sql
   SELECT alert_id, COUNT(*) as count, recipient_name
   FROM alert_notifications
   WHERE created_at > NOW() - INTERVAL '5 minutes'
   GROUP BY alert_id, recipient_name;
   ```
3. **Expected result:**
   ```
   alert_id                              | count | recipient_name
   --------------------------------------|-------|---------------
   new-alert-uuid-here                   | 1     | All Admins
   ```
4. **If you see count = 1:** ✅ Fixed!
5. **If you see count = 6:** ❌ Old code still running, check deployment

---

## Verification Queries

### Check for Duplicates:
```sql
-- Should return 0 rows after cleanup
SELECT alert_id, COUNT(*) as count
FROM alert_notifications
GROUP BY alert_id
HAVING COUNT(*) > 1;
```

### Check Total Notifications:
```sql
-- Count should equal number of unique alerts
SELECT 
    COUNT(*) as total_notifications,
    COUNT(DISTINCT alert_id) as unique_alerts
FROM alert_notifications;
-- If total_notifications = unique_alerts, you're good! ✅
```

### Check Recent Notifications:
```sql
-- See the last 10 notifications
SELECT 
    id,
    alert_id,
    account_id,
    recipient_name,
    created_at
FROM alert_notifications
ORDER BY created_at DESC
LIMIT 10;
-- All should have recipient_name = 'All Admins' or 'All Responders'
```

---

## What You Should See After Fix

### Before (Wrong):
```
alert_id: abc-123
  → notification 1: account_id = 1
  → notification 2: account_id = 3
  → notification 3: account_id = 4
  → notification 4: account_id = 5
  → notification 5: account_id = 6
  → notification 6: account_id = 7
Total: 6 notifications ❌
```

### After (Correct):
```
alert_id: abc-123
  → notification 1: account_id = 1, recipient_name = 'All Admins'
Total: 1 notification ✅
```

---

## How Broadcast Notifications Work

### The Concept:
- **ONE notification** is created per alert
- `account_id` = first admin's ID (just a placeholder)
- `recipient_name` = "All Admins" (indicates it's for everyone)
- **All admins** can see this notification in their inbox
- When **one admin** marks it as read, **all admins** see it as read

### Why This Is Better:
- ✅ 1 database entry instead of 6
- ✅ Faster queries
- ✅ Cleaner database
- ✅ No 404 errors
- ✅ Easier to manage

---

## Files That Create Notifications

All these files have been updated to use broadcast notifications:

1. ✅ **`user-create-alerts.js`** - User creates alert
   ```javascript
   INSERT INTO alert_notifications (...)
   VALUES (..., firstAdmin.id, 'All Admins', ...)
   ```

2. ✅ **`anonymous-alert.js`** - Anonymous SOS
   ```javascript
   INSERT INTO alert_notifications (...)
   VALUES (..., firstAdmin.id, 'All Admins', ...)
   ```

3. ✅ **`app/api/alerts/verify/route.js`** - Admin verifies alert
   ```javascript
   // For responders
   INSERT INTO alert_notifications (...)
   VALUES (..., firstResponder.id, 'All Responders', ...)
   
   // For admins
   INSERT INTO alert_notifications (...)
   VALUES (..., firstAdmin.id, 'All Admins', ...)
   ```

---

## Troubleshooting

### Still seeing duplicates after cleanup?

**Check if old code is still running:**
```bash
# View the deployed function code
cat netlify/functions/user-create-alerts.js | grep "All Admins"
# Should see: 'All Admins' in the VALUES statement
```

**Check deployment:**
```bash
# Redeploy to ensure new code is live
netlify deploy --prod
```

### New alerts still creating 6 notifications?

**The old code is still deployed!** You need to:
1. Verify the code changes are saved
2. Redeploy the functions
3. Clear any caches
4. Restart the server

---

## Quick Fix Commands

### 1. Clean Database:
```sql
DELETE FROM alert_notifications
WHERE id NOT IN (
    SELECT MIN(id) FROM alert_notifications GROUP BY alert_id
);
```

### 2. Verify:
```sql
SELECT alert_id, COUNT(*) 
FROM alert_notifications 
GROUP BY alert_id 
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### 3. Test:
- Create new alert
- Check database
- Should see only 1 notification

---

## Summary

**Problem:** 6 notifications per alert (one per admin)
**Cause:** Old code was still running
**Solution:**
1. ✅ Code has been fixed (broadcast notifications)
2. ⏳ Clean up old duplicates (run SQL script)
3. ⏳ Restart/redeploy server
4. ⏳ Test with new alert

**Expected Result:** 1 notification per alert, visible to all admins! 🎉
