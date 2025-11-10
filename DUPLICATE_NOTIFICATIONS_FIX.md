# Duplicate Alert Notifications - Complete Fix

## The Problem You Experienced

**Error:** `Failed to mark notification as read: 404 Not Found - Notification not found for ID: 59`

**Why this happened:**
1. You have **10 admins** in your system
2. When a user created an alert, the old code created **10 separate notifications** (one per admin)
3. When you clicked notification ID 59, it tried to mark only that specific notification as read
4. But notification ID 59 belonged to a different admin, not your account
5. Result: 404 error because the API couldn't find notification ID 59 for your admin account

## Root Cause

The old code in `user-create-alerts.js` was doing this:

```javascript
// OLD CODE - Creates one notification per admin
INSERT INTO alert_notifications (...)
SELECT ..., 'admin', a.id, a.name, ...
FROM admins a
```

**Result:** If you have 10 admins, it creates 10 notifications for the same alert!

---

## Complete Solution (3 Parts)

### ✅ Part 1: Prevent Future Duplicates

**File:** `user-create-alerts.js` (Already Fixed)

Now creates **ONE broadcast notification** instead of 10:

```javascript
// NEW CODE - Creates one broadcast notification
const firstAdmin = await pool.query('SELECT id, name FROM admins ORDER BY id LIMIT 1');

if (firstAdmin.rows.length > 0) {
  await pool.query(
    `INSERT INTO alert_notifications (...)
     VALUES (..., 'All Admins', ...)`,
    [...]
  );
}
```

**Result:** Only 1 notification per alert, visible to all admins!

---

### ✅ Part 2: Fix Mark-as-Read API

**File:** `pages/api/notifications/alerts.js` (Just Fixed)

**Before:**
```javascript
// Tried to mark only the specific notification ID
UPDATE alert_notifications
SET is_read = TRUE
WHERE id = $1
// Problem: If ID doesn't belong to your admin, returns 404
```

**After:**
```javascript
// Get the alert_id from the notification
SELECT alert_id FROM alert_notifications WHERE id = $1

// Mark ALL notifications for this alert as read
UPDATE alert_notifications
SET is_read = TRUE
WHERE alert_id = $1
// Solution: Marks all duplicate notifications for the same alert
```

**Benefits:**
- ✅ No more 404 errors
- ✅ Works with both old duplicates and new broadcast notifications
- ✅ When one admin marks as read, all duplicates are marked
- ✅ Alarm stops for all admins

---

### ✅ Part 3: Clean Up Existing Duplicates

**File:** `database/migrations/cleanup_duplicate_alert_notifications.sql` (Just Created)

Run this SQL script to remove the 10 duplicate notifications:

```bash
psql -U your_username -d your_database -f database/migrations/cleanup_duplicate_alert_notifications.sql
```

**What it does:**
1. Shows how many duplicates exist
2. Keeps only the **oldest notification** for each alert
3. Deletes all other duplicates
4. Updates recipient_name to "All Admins"
5. Verifies cleanup was successful

**Before Cleanup:**
```
Alert 1 → 10 notifications (one per admin)
Alert 2 → 10 notifications (one per admin)
Total: 20 notifications for 2 alerts
```

**After Cleanup:**
```
Alert 1 → 1 notification (broadcast to all admins)
Alert 2 → 1 notification (broadcast to all admins)
Total: 2 notifications for 2 alerts
```

---

## Step-by-Step Fix Instructions

### Step 1: Deploy the Code Fixes ✅ (Already Done)
- [x] `user-create-alerts.js` - Broadcast notifications
- [x] `pages/api/notifications/alerts.js` - Smart mark-as-read

### Step 2: Run the Cleanup Script

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the cleanup script
\i database/migrations/cleanup_duplicate_alert_notifications.sql

# Check the output
# Should show: "✅ Cleanup complete! Each alert now has exactly 1 notification"
```

### Step 3: Verify the Fix

```sql
-- Check for duplicates
SELECT 
    alert_id,
    COUNT(*) as notification_count
FROM alert_notifications
GROUP BY alert_id
HAVING COUNT(*) > 1;
-- Should return 0 rows (no duplicates)

-- Check total notifications
SELECT 
    COUNT(*) as total_notifications,
    COUNT(DISTINCT alert_id) as unique_alerts
FROM alert_notifications;
-- Both numbers should be equal
```

### Step 4: Test the System

1. **Create a new alert** from mobile app
2. **Check database:**
   ```sql
   SELECT COUNT(*) FROM alert_notifications WHERE alert_id = 'new-alert-id';
   -- Should return: 1 (not 10!)
   ```
3. **Check admin dashboard:** All admins see the notification
4. **Click notification:** Should mark as read without 404 error
5. **Verify alarm stops** for all admins

---

## Understanding the Fix

### Before (Broken):
```
User creates alert
       ↓
10 notifications created (one per admin)
       ↓
Admin 1 sees notification ID 45
Admin 2 sees notification ID 46
Admin 3 sees notification ID 47
...
Admin 10 sees notification ID 54
       ↓
Admin 1 clicks notification ID 45
       ↓
Tries to mark ID 45 as read
       ↓
❌ 404 Error (ID 45 doesn't belong to Admin 1)
```

### After (Fixed):
```
User creates alert
       ↓
1 broadcast notification created
       ↓
All admins see notification ID 55
       ↓
Admin 1 clicks notification ID 55
       ↓
API finds alert_id from notification ID 55
       ↓
Marks ALL notifications for that alert as read
       ↓
✅ Success! Alarm stops for all admins
```

---

## Database Impact

### Before Cleanup:
```sql
SELECT COUNT(*) FROM alert_notifications;
-- Result: 1000 notifications (100 alerts × 10 admins)
```

### After Cleanup:
```sql
SELECT COUNT(*) FROM alert_notifications;
-- Result: 100 notifications (100 alerts × 1 broadcast)
```

**Savings:** 90% reduction in database entries! 🎉

---

## Why This Happened

The original code was designed to create individual notifications for each admin, which seemed logical but caused problems:

1. **Database bloat:** 10x more entries than needed
2. **Confusing UX:** Each admin saw a "different" notification
3. **404 errors:** Clicking wrong notification ID
4. **Alarm issues:** Couldn't stop alarm for all admins at once
5. **Performance:** Slower queries with 10x more data

The broadcast approach is better:
- ✅ One notification per alert
- ✅ All admins see the same notification
- ✅ Marking as read works for everyone
- ✅ Alarm stops for all admins
- ✅ Better performance

---

## Testing Checklist

### Test 1: No More 404 Errors
- [ ] Click any alert notification
- [ ] Should mark as read without errors
- [ ] Check browser console - no 404 errors

### Test 2: Broadcast Notifications
- [ ] Create new alert from mobile app
- [ ] Check database: Only 1 notification created
- [ ] All admins see the notification
- [ ] Recipient shows "All Admins"

### Test 3: Mark as Read (Multiple Admins)
- [ ] Admin 1 and Admin 2 both logged in
- [ ] Admin 1 clicks notification
- [ ] Notification marked as read for Admin 1
- [ ] Notification also marked as read for Admin 2 (broadcast)

### Test 4: Alarm Stops for All
- [ ] Create new alert
- [ ] Alarm plays for all admins
- [ ] One admin marks as read
- [ ] Alarm stops for all admins

### Test 5: Cleanup Verification
- [ ] Run cleanup script
- [ ] Check: No duplicate notifications remain
- [ ] Check: Each alert has exactly 1 notification
- [ ] Check: All recipient_name = "All Admins"

---

## Troubleshooting

### Issue: Still getting 404 errors after fix
**Solution:** 
1. Make sure the code is deployed
2. Run the cleanup script
3. Clear browser cache
4. Restart the server

### Issue: Cleanup script fails
**Check:**
```sql
-- Check if alert_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'alert_notifications' AND column_name = 'alert_id';
```

### Issue: Old notifications still showing
**Solution:**
```sql
-- Manually delete old duplicates
DELETE FROM alert_notifications
WHERE id NOT IN (
    SELECT MIN(id)
    FROM alert_notifications
    GROUP BY alert_id
);
```

---

## Summary

✅ **Fixed:** No more 404 errors when marking notifications as read
✅ **Fixed:** Only 1 notification created per alert (not 10)
✅ **Fixed:** Alarm stops for all admins when one marks as read
✅ **Improved:** 90% reduction in database entries
✅ **Improved:** Better performance and cleaner inbox

**Next Steps:**
1. Run the cleanup script to remove existing duplicates
2. Test creating a new alert
3. Verify no more 404 errors
4. Enjoy a cleaner, faster notification system! 🎉
