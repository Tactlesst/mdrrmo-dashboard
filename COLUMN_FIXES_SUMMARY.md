# Column Name Fixes - Complete Summary

## 🔧 Problem
Multiple endpoints were using non-existent columns in `responder_sessions` table:
- ❌ `is_active` (doesn't exist)
- ❌ `last_active_at` (doesn't exist)

## ✅ Solution
Use the correct columns from the actual schema:
- ✅ `ended_at` (NULL = active, NOT NULL = ended)
- ✅ `location_updated_at` (timestamp of last location update)

---

## 📝 Files Fixed

### **1. pages/api/admins/status.js**
**Purpose**: Show online/offline status of admins and responders

**Changes:**
- ✅ Cleanup query: `is_active = FALSE` → `ended_at = NOW()`
- ✅ Cleanup condition: `last_active_at < NOW()` → `location_updated_at < NOW()`
- ✅ Responder query: Calculate `is_active` from `ended_at IS NULL`
- ✅ Use `location_updated_at` instead of `last_active_at`

### **2. pages/api/responders/sessions/index.js**
**Purpose**: List active responder sessions

**Changes:**
- ✅ WHERE clause: `is_active = TRUE` → `ended_at IS NULL`
- ✅ SELECT: Calculate `is_active` dynamically
- ✅ Use `location_updated_at` instead of `last_active_at`
- ✅ Filter: Only sessions updated in last 5 minutes

### **3. pages/api/responders/location.js**
**Purpose**: Update responder location from mobile app

**Changes:**
- ✅ UPDATE: Removed `is_active = TRUE` and `last_active_at = NOW()`
- ✅ WHERE: Added `ended_at IS NULL` condition
- ✅ INSERT: Removed `is_active` column
- ✅ Status: Changed from 'online' to 'active'

### **4. pages/api/sessions/cleanup.js**
**Purpose**: Clean up old sessions

**Changes:**
- ✅ UPDATE: `is_active = FALSE` → `ended_at = NOW()`
- ✅ WHERE: `last_active_at < NOW()` → `location_updated_at < NOW()`
- ✅ Condition: `is_active = TRUE` → `ended_at IS NULL`

### **5. pages/api/responders/tracking.js** (Already fixed)
**Purpose**: Track responder locations on map

**Changes:**
- ✅ WHERE: `is_active = TRUE` → `ended_at IS NULL`
- ✅ Use `location_updated_at` for filtering

### **6. pages/api/heartbeat.js** (Already fixed)
**Purpose**: Keep admin session alive

**Changes:**
- ✅ Removed `is_active = TRUE` update
- ✅ Only updates `last_active_at`

### **7. pages/api/responders/heartbeat.js** (Already fixed)
**Purpose**: Keep responder session alive

**Changes:**
- ✅ UPDATE: `last_active_at` → `location_updated_at`
- ✅ Removed `is_active = TRUE`
- ✅ Added `ended_at IS NULL` condition

---

## 📊 Schema Comparison

### **admin_sessions Table**
```sql
CREATE TABLE admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_email VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,  ✅ EXISTS
  last_active_at TIMESTAMP,        ✅ EXISTS
  ...
);
```

### **responder_sessions Table**
```sql
CREATE TABLE responder_sessions (
  id UUID PRIMARY KEY,
  responder_id INTEGER,
  status VARCHAR(20),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,              ✅ Use this (NULL = active)
  location_updated_at TIMESTAMP,   ✅ Use this (last update time)
  -- NO is_active column ❌
  -- NO last_active_at column ❌
  ...
);
```

---

## 🎯 Key Patterns

### **Check if Session is Active**
```sql
-- OLD (WRONG)
WHERE is_active = TRUE

-- NEW (CORRECT)
WHERE ended_at IS NULL
```

### **Mark Session as Inactive**
```sql
-- OLD (WRONG)
UPDATE responder_sessions SET is_active = FALSE

-- NEW (CORRECT)
UPDATE responder_sessions SET ended_at = NOW()
```

### **Get Last Activity Time**
```sql
-- OLD (WRONG)
SELECT last_active_at FROM responder_sessions

-- NEW (CORRECT)
SELECT location_updated_at FROM responder_sessions
```

### **Update Activity Timestamp**
```sql
-- OLD (WRONG)
UPDATE responder_sessions SET last_active_at = NOW()

-- NEW (CORRECT)
UPDATE responder_sessions SET location_updated_at = NOW()
```

---

## ✅ Testing Checklist

- [ ] `/api/admins/status` - Returns admin and responder status
- [ ] `/api/responders/sessions` - Lists active sessions
- [ ] `/api/responders/location` - Mobile app can update location
- [ ] `/api/sessions/cleanup` - Cleans up old sessions
- [ ] `/api/responders/tracking` - Shows responders on map
- [ ] `/api/heartbeat` - Admin heartbeat works
- [ ] `/api/responders/heartbeat` - Responder heartbeat works
- [ ] No "column does not exist" errors
- [ ] Online/offline status displays correctly

---

## 🔍 Verify in Database

```sql
-- Check responder_sessions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'responder_sessions'
ORDER BY ordinal_position;

-- Should NOT see:
-- ❌ is_active
-- ❌ last_active_at

-- Should see:
-- ✅ ended_at
-- ✅ location_updated_at
-- ✅ status
-- ✅ started_at
```

---

## 📝 Summary

| Issue | Files Affected | Fix Applied |
|-------|----------------|-------------|
| `is_active` doesn't exist | 4 files | Use `ended_at IS NULL` |
| `last_active_at` doesn't exist | 4 files | Use `location_updated_at` |
| Wrong status values | 1 file | 'online' → 'active' |
| Missing WHERE conditions | 2 files | Added `ended_at IS NULL` |

**Total files fixed**: 7  
**Total errors resolved**: ~10+  
**Status**: ✅ ALL COLUMN ERRORS FIXED

---

**Impact**: Critical - Fixes all "column does not exist" errors for responder sessions
**Risk**: Low - Uses correct schema, no data loss
**Testing**: Required - Verify all endpoints work correctly
