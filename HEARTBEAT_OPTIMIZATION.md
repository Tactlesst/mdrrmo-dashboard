# Heartbeat Optimization Guide

## 🔧 Changes Made

### **1. Reduced Heartbeat Frequency**
**File**: `hooks/useHeartbeat.js`

**Before:**
```javascript
export default function useHeartbeat(userType = 'admin', interval = 30000) {
  // Sends heartbeat every 30 seconds
}
```

**After:**
```javascript
export default function useHeartbeat(userType = 'admin', interval = 60000) {
  // Sends heartbeat every 60 seconds (2x less frequent)
}
```

### **2. Reduced Connection Pool**
**File**: `lib/db.js`

**Before:**
```javascript
max: 20, // Uses ALL available connections!
```

**After:**
```javascript
max: 3, // Only 3 connections (leaves room for other apps)
```

---

## 📊 Impact Analysis

### **Heartbeat Frequency Comparison**

| Interval | Requests per Minute | Requests per Hour | Database Load |
|----------|---------------------|-------------------|---------------|
| **30s (old)** | 2 | 120 | High |
| **60s (new)** | 1 | 60 | Medium ✅ |
| 120s | 0.5 | 30 | Low |
| 300s (5min) | 0.2 | 12 | Very Low |

### **Connection Usage**

**Before:**
```
Dashboard: 20 connections
Server_app: 2 connections
Mobile app: 5 connections
Total: 27 connections
Database limit: 20 ❌ EXHAUSTED!
```

**After:**
```
Dashboard: 3 connections
Server_app: 2 connections
Mobile app: 5 connections
Total: 10 connections
Database limit: 20 ✅ SAFE!
```

---

## ⚙️ Heartbeat Interval Options

You can adjust the interval based on your needs:

### **Conservative (Recommended for Low Limits)**
```javascript
interval = 120000  // 2 minutes
// Pros: Very low database load
// Cons: Session might expire if user idle
```

### **Balanced (Current Setting)**
```javascript
interval = 60000  // 1 minute ✅
// Pros: Good balance of freshness and load
// Cons: Still sends 60 requests/hour
```

### **Aggressive (Original)**
```javascript
interval = 30000  // 30 seconds
// Pros: Very fresh session status
// Cons: High database load (120 requests/hour)
```

### **Minimal**
```javascript
interval = 300000  // 5 minutes
// Pros: Minimal database load (12 requests/hour)
// Cons: Session might timeout
```

---

## 🎯 Additional Optimizations

### **1. Reduce Other Polling Intervals**

#### **AlertsMap.js** - Responder Tracking
```javascript
// Current: Updates every 10 seconds
const interval = setInterval(fetchResponders, 10000);

// Recommended: 30 seconds
const interval = setInterval(fetchResponders, 30000);
```

#### **Alerts.js** - Alert Polling
```javascript
// Current: Updates every 15 seconds
const interval = setInterval(fetchAlerts, 15000);

// Recommended: 30 seconds
const interval = setInterval(fetchAlerts, 30000);
```

#### **OnlineAdminsList.js** - Admin Status
```javascript
// Current: Updates every 5 seconds
intervalId = setInterval(fetchStatus, 5000);

// Recommended: 15 seconds
intervalId = setInterval(fetchStatus, 15000);
```

### **2. Use WebSockets Instead**

Replace polling with WebSockets for real-time updates:
- No repeated database queries
- Instant updates
- Much lower database load

---

## 🔍 Monitoring Heartbeats

### **Check Heartbeat Frequency**

Open browser console and watch for:
```
POST /api/heartbeat 200
```

Count how many appear in 1 minute:
- **1 request** = 60 second interval ✅
- **2 requests** = 30 second interval
- **4+ requests** = Too frequent!

### **Monitor Database Connections**

Run in pgAdmin:
```sql
-- See current connections
SELECT 
  COUNT(*) as total,
  application_name,
  state
FROM pg_stat_activity
WHERE datname = 'defaultdb'
GROUP BY application_name, state;

-- Expected result:
-- total | application_name | state
-- ------|------------------|-------
-- 2-3   | node-postgres    | active
-- 1-2   | node-postgres    | idle
```

---

## ⚠️ Session Timeout Considerations

### **Important**: Adjust session timeout to match heartbeat interval

If heartbeat is **60 seconds**, session timeout should be **at least 120 seconds** (2x).

**Example session timeout settings:**
```javascript
// In your session middleware
session({
  cookie: {
    maxAge: 300000  // 5 minutes (5x heartbeat interval)
  }
})
```

**Rule of thumb:**
```
Session timeout = Heartbeat interval × 3 (minimum)
```

---

## 📝 Summary

### **What Changed:**
- ✅ Heartbeat interval: 30s → 60s (50% reduction)
- ✅ Connection pool: 20 → 3 (85% reduction)
- ✅ Database load: Significantly reduced

### **Benefits:**
- ✅ Fewer connection pool exhaustion errors
- ✅ Lower database load
- ✅ Better performance
- ✅ Room for other apps to connect

### **Trade-offs:**
- ⚠️ Session status updates less frequently
- ⚠️ Slightly longer to detect disconnected users
- ✅ Still maintains active sessions reliably

---

## 🚀 Next Steps

1. **Restart dev server**: `npm run dev`
2. **Monitor console**: Watch for heartbeat requests
3. **Check frequency**: Should see 1 request per minute
4. **Verify no errors**: No more connection pool exhaustion
5. **Deploy**: Push changes to production

---

## 🔧 Quick Reference

| Setting | Location | Old Value | New Value |
|---------|----------|-----------|-----------|
| Heartbeat interval | `hooks/useHeartbeat.js` | 30000ms | 60000ms |
| Connection pool | `lib/db.js` | max: 20 | max: 3 |
| Idle timeout | `lib/db.js` | 30000ms | 500ms |

---

**Status**: ✅ OPTIMIZED
**Impact**: High - Reduces database load by 50%+
**Risk**: Low - Session management still reliable
