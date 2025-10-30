# Available Responders Count Fix

## Problem

The dashboard showed:
```
Responders Available
0 / 8
```

**All responders showed as 0 available**, even though some were marked as "active".

---

## Root Cause

The code was checking the **wrong field** to count available responders.

### **The Bug:**

```javascript
// Line 125 - BEFORE (WRONG):
const activeResponders = respondersStatus.filter(r => r.is_active).length;
```

**What `is_active` means:**
- `is_active = true` → Session exists (ended_at IS NULL)
- `is_active = false` → Session ended

**Problem:** This only checks if a session exists, NOT if the responder is actively working!

### **What We Should Check:**

The API returns `responder_status` field with values:
- `"active"` - Responder is actively working
- `"standby"` - Responder is on standby
- `"ready to go"` - Responder is ready
- `"offline"` - Responder is offline

**We need to count responders where `responder_status === 'active'`!**

---

## The Fix ✅

```javascript
// Line 125 - AFTER (CORRECT):
const activeResponders = respondersStatus.filter(r => 
  r.responder_status?.toLowerCase() === 'active'
).length;
```

**Now it correctly counts responders who are:**
- Marked as "active" (working)
- Ready to respond to alerts

---

## API Response Structure

From `/api/admins/status`:

```json
{
  "responders": [
    {
      "id": 1,
      "name": "qwe Qwe",
      "email": "qwe@gmail.com",
      "is_active": true,              // ← Session exists
      "responder_status": "active",   // ← Actually working!
      "status": "Online",
      "last_active_at": "2025-10-30T12:00:00Z"
    },
    {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "is_active": true,              // ← Session exists
      "responder_status": "standby",  // ← On standby (not active)
      "status": "Standby",
      "last_active_at": "2025-10-30T11:55:00Z"
    },
    {
      "id": 3,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "is_active": false,             // ← Session ended
      "responder_status": "offline",  // ← Offline
      "status": "Offline",
      "last_active_at": "2025-10-29T18:00:00Z"
    }
  ]
}
```

### **Field Meanings:**

| Field | Type | Meaning |
|-------|------|---------|
| `is_active` | boolean | Session exists (ended_at IS NULL) |
| `responder_status` | string | Work status ("active", "standby", "ready to go", "offline") |
| `status` | string | Display status ("Online", "Standby", "Ready", "Offline") |

### **Counting Logic:**

**Before (WRONG):**
```javascript
filter(r => r.is_active)
// Counts: Responder 1 ✓, Responder 2 ✓, Responder 3 ✗
// Result: 2 / 3
```
**Problem:** Counts responder on "standby" as available!

**After (CORRECT):**
```javascript
filter(r => r.responder_status === 'active')
// Counts: Responder 1 ✓, Responder 2 ✗, Responder 3 ✗
// Result: 1 / 3
```
**Correct:** Only counts actively working responders!

---

## Example Scenarios

### **Scenario 1: 3 Responders, 1 Active**

```
Responder A: responder_status = "active"    ✓ Counted
Responder B: responder_status = "standby"   ✗ Not counted
Responder C: responder_status = "offline"   ✗ Not counted

Display: 1 / 3
```

### **Scenario 2: 8 Responders, 0 Active**

```
All responders: responder_status = "offline" or "standby"

Display: 0 / 8  ← This was your case!
```

### **Scenario 3: 5 Responders, 3 Active**

```
Responder A: responder_status = "active"    ✓
Responder B: responder_status = "active"    ✓
Responder C: responder_status = "standby"   ✗
Responder D: responder_status = "active"    ✓
Responder E: responder_status = "offline"   ✗

Display: 3 / 5
```

---

## Why It Showed 0 / 8

Your 8 responders were probably:
- All had `is_active = false` (no active sessions)
- OR had sessions but `responder_status ≠ 'active'` (on standby/offline)

**After the fix:** It will correctly count only responders with `responder_status = 'active'`.

---

## How to Make Responders "Available"

For a responder to be counted as "available", they must:

1. **Log into the mobile app**
2. **Mark themselves as "active"** in the app
3. The app sends their status to the server
4. Server updates `responder_sessions` table with `status = 'active'`

**If responders are not marking themselves as "active", they won't be counted!**

---

## Testing

### **Test 1: No Active Responders**
1. All responders offline or on standby
2. ✅ Should show "0 / 8"

### **Test 2: Some Active Responders**
1. 3 responders mark themselves as "active"
2. ✅ Should show "3 / 8"

### **Test 3: All Active Responders**
1. All 8 responders mark themselves as "active"
2. ✅ Should show "8 / 8"

### **Test 4: Check Console Logs**
```javascript
console.log('All responders from status API:', respondersStatus);
console.log('Active responders:', respondersStatus.filter(r => r.responder_status === 'active'));
console.log('Available responders count:', activeResponders);
```

Look for responders with `responder_status: "active"`.

---

## Related Files

### **API Endpoint:**
`pages/api/admins/status.js` - Returns responder status data

**Key Query (Line 53-86):**
```sql
SELECT 
  r.id,
  r.name,
  COALESCE(s.is_active, false) AS is_active,
  COALESCE(s.status, 'offline') AS responder_status,  -- This is what we need!
  ...
FROM responders r
LEFT JOIN LATERAL (
  SELECT 
    CASE WHEN ended_at IS NULL THEN true ELSE false END as is_active,
    status,  -- 'active', 'standby', 'ready to go', 'offline'
    location_updated_at
  FROM responder_sessions
  WHERE responder_id = r.id
  ORDER BY location_updated_at DESC
  LIMIT 1
) s ON true
```

### **Mobile App:**
Responders set their status in the mobile app, which updates `responder_sessions.status`.

---

## Files Modified
- ✅ `components/MapDisplay.js` - Fixed available responders count to check `responder_status` instead of `is_active`

---

## Summary

**Problem:** "Responders Available" showing 0 / 8
**Root Cause:** Checking wrong field (`is_active` instead of `responder_status`)
**Solution:** Filter by `responder_status === 'active'`
**Result:** Correctly counts actively working responders! ✅

**Key Insight:** Having an active session (`is_active = true`) doesn't mean the responder is actively working. They must explicitly mark themselves as "active" in the app!
