# Responder Status Fix - "Should Be Online" Issue

## Problem
Responders were showing as offline even when actively using the app.

## Root Cause
The responder status check had a **5-minute timeout**, which was too aggressive:

```javascript
// OLD: 5-minute timeout
WHERE location_updated_at < NOW() - INTERVAL '5 minutes'
```

**Why this caused issues:**
- Responder heartbeat might not send every 5 minutes
- Network delays or app backgrounding could cause gaps
- Location updates might be less frequent than 5 minutes
- Result: Responder appears offline even when active

---

## Fix Applied ✅

### Changed timeout from 5 minutes to 10 minutes

**File:** `pages/api/admins/status.js`

**Changes:**
1. **Cleanup query** (line 20): 5 min → 10 min
2. **Status check** (line 66): 5 min → 10 min

```javascript
// NEW: 10-minute timeout (more tolerant)
WHERE location_updated_at < NOW() - INTERVAL '10 minutes'

// Status check also updated
WHEN s.status = 'active' AND s.location_updated_at > NOW() - INTERVAL '10 minutes'
```

---

## How Responder Status Works

### **Status Flow:**

1. **Responder opens app** → Creates session in `responder_sessions`
2. **App sends heartbeat** → Updates `location_updated_at = NOW()`
3. **Dashboard checks status** → If `location_updated_at` < 10 min old → "Online"
4. **No heartbeat for 10 min** → Marked as "Offline"

### **Status Levels:**

| Responder Status | Display | Condition |
|-----------------|---------|-----------|
| `active` | **Online** (green) | Updated within 10 min |
| `standby` | **Standby** (yellow) | Any time |
| `ready to go` | **Ready** (blue) | Any time |
| `offline` or old | **Offline** (gray) | No update for 10+ min |

---

## Testing

### **Before Fix:**
- Responder using app actively
- Heartbeat sent at 0:00
- At 5:01 → Shows "Offline" ❌ (even though active!)

### **After Fix:**
- Responder using app actively
- Heartbeat sent at 0:00
- At 5:01 → Still shows "Online" ✅
- At 10:01 → Shows "Offline" (correct)

---

## Responder Heartbeat

The responder app should be sending heartbeats via:
- **Endpoint:** `/api/responders/heartbeat`
- **Updates:** `location_updated_at` timestamp
- **Recommended frequency:** Every 2-5 minutes

### **Check Responder App:**

Make sure the responder app is configured to send heartbeats:

```javascript
// Responder app should have something like:
useHeartbeat('responder', 120000); // 2 minutes
// or
useHeartbeat('responder', 300000); // 5 minutes
```

---

## Comparison: Admin vs Responder

| Feature | Admin | Responder |
|---------|-------|-----------|
| **Heartbeat updates** | `last_active_at` | `location_updated_at` |
| **Offline timeout** | 3 minutes | 10 minutes |
| **Session table** | `admin_sessions` | `responder_sessions` |
| **Status field** | `is_active` | `status` (active/standby/ready) |

**Why different timeouts?**
- Admins: Desktop app, stable connection → 3 min is fine
- Responders: Mobile app, GPS tracking, can background → 10 min is safer

---

## If Responders Still Show Offline

### 1. **Check if heartbeat is being sent:**

Look at responder app logs for:
```
Heartbeat sent to /api/responders/heartbeat
```

### 2. **Check database:**

```sql
-- Check responder sessions
SELECT 
  r.name,
  rs.status,
  rs.location_updated_at,
  rs.ended_at,
  NOW() - rs.location_updated_at as time_since_update
FROM responders r
JOIN responder_sessions rs ON rs.responder_id = r.id
WHERE rs.ended_at IS NULL
ORDER BY rs.location_updated_at DESC;
```

### 3. **Manually update (for testing):**

```sql
-- Force responder to show as online
UPDATE responder_sessions 
SET location_updated_at = NOW(),
    status = 'active'
WHERE responder_id = 'YOUR_RESPONDER_ID'
  AND ended_at IS NULL;
```

---

## Recommended Responder App Configuration

If you control the responder app, ensure:

1. **Heartbeat interval:** 2-5 minutes
2. **Background mode:** Keep sending heartbeats when app is backgrounded
3. **Network retry:** Retry failed heartbeats
4. **Location updates:** Send location with heartbeat

---

## Files Modified
- ✅ `pages/api/admins/status.js` - Increased responder timeout to 10 minutes

## Summary
- **Old timeout:** 5 minutes (too aggressive)
- **New timeout:** 10 minutes (more tolerant)
- **Result:** Responders will stay online longer, matching real usage patterns
