# Heartbeat API Critical Fix

## Issue Found in `/api/heartbeat.js`

### **Problem:**
The heartbeat API was only updating `last_active_at` but **NOT setting `is_active = TRUE`**.

```javascript
// OLD CODE (BUGGY):
await pool.query(
  `UPDATE admin_sessions 
   SET last_active_at = NOW()
   WHERE admin_email = $1`,
  [adminEmail]
);
```

### **Why This Was Breaking Status:**

1. **Scenario 1: Session marked inactive**
   - Admin goes offline (marked `is_active = FALSE` by cleanup)
   - Admin comes back online
   - Heartbeat updates `last_active_at` but leaves `is_active = FALSE`
   - **Result:** Admin appears offline even though sending heartbeats!

2. **Scenario 2: No session record**
   - New admin logs in
   - Heartbeat tries to UPDATE but no row exists
   - UPDATE affects 0 rows
   - **Result:** Admin never appears online!

### **The Fix:**

Changed to UPSERT (INSERT ... ON CONFLICT):

```javascript
// NEW CODE (FIXED):
await pool.query(
  `INSERT INTO admin_sessions (admin_email, is_active, last_active_at)
   VALUES ($1, TRUE, NOW())
   ON CONFLICT (admin_email) 
   DO UPDATE SET 
     is_active = TRUE,
     last_active_at = NOW()`,
  [adminEmail]
);
```

**Benefits:**
- ✅ Creates session if it doesn't exist
- ✅ Always sets `is_active = TRUE`
- ✅ Updates `last_active_at` timestamp
- ✅ Works even if session was previously marked inactive

---

## Database Requirement

This fix requires a **UNIQUE constraint** on `admin_email`:

```sql
-- Check if constraint exists:
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'admin_sessions' 
  AND constraint_type = 'UNIQUE';

-- If not exists, add it:
ALTER TABLE admin_sessions 
ADD CONSTRAINT admin_sessions_admin_email_key 
UNIQUE (admin_email);
```

---

## Responder Heartbeat Note

The responder heartbeat (`/api/responders/heartbeat.js`) has a different structure:
- Uses `responder_id` instead of email
- Updates `location_updated_at` instead of `last_active_at`
- Filters by `ended_at IS NULL`

**Current responder heartbeat is OK** because:
- Responder sessions are created when they start their shift
- Heartbeat only updates existing active sessions
- Different workflow than admin sessions

However, if you want consistency, you could apply a similar UPSERT pattern.

---

## Testing

### Before Fix:
1. Admin logs in → appears online
2. Wait 3+ minutes → marked offline by cleanup
3. Admin still active, heartbeat sends → **STAYS OFFLINE** ❌

### After Fix:
1. Admin logs in → appears online
2. Wait 3+ minutes → marked offline by cleanup
3. Admin still active, heartbeat sends → **BACK ONLINE** ✅

### Test Steps:
1. Apply the fix (already done)
2. Restart your app
3. Log in as admin
4. Manually run cleanup in database:
   ```sql
   UPDATE admin_sessions SET is_active = FALSE WHERE admin_email = 'your@email.com';
   ```
5. Wait 2 minutes for next heartbeat
6. Check status → should show online again

---

## Summary

**Root Cause:** Heartbeat wasn't reactivating sessions that were marked inactive.

**Fix Applied:** Changed UPDATE to UPSERT with `is_active = TRUE`.

**Impact:** Admins will now correctly appear online when sending heartbeats, even if they were previously marked offline.

**Files Modified:**
- ✅ `pages/api/heartbeat.js` - Fixed with UPSERT
