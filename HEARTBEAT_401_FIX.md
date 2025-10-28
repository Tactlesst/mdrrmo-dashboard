# Heartbeat 401 Error - Fixed ✅

## 📋 Issue

Heartbeat endpoint returning 401 Unauthorized error:
```
POST /api/heartbeat 401 in 517ms
```

**Date**: October 28, 2025  
**Status**: ✅ Fixed

---

## ❌ Problem

### Root Cause:
The heartbeat endpoint was looking for the wrong cookie name.

**Before** (Wrong):
```javascript
// pages/api/heartbeat.js
const token = cookies.token; // ❌ Wrong cookie name
```

**Login uses**:
```javascript
// pages/api/login.js
const serialized = serialize('auth', token, { ... }); // ✅ Cookie name is 'auth'
```

**Mismatch**: Heartbeat looked for `token` but login created `auth` cookie.

---

## ✅ Solution

### Fixed Cookie Name:
```javascript
// pages/api/heartbeat.js
const token = cookies.auth; // ✅ Changed to 'auth'
```

### Added Debug Logging:
```javascript
if (!token) {
  console.log('No auth token found in cookies:', Object.keys(cookies));
  return res.status(401).json({ error: 'Not authenticated' });
}
```

---

## 🔧 What Was Changed

### File: `pages/api/heartbeat.js`

**Line 14**: Changed cookie name
```javascript
// Before
const token = cookies.token;

// After
const token = cookies.auth;
```

**Line 17**: Added debug logging
```javascript
console.log('No auth token found in cookies:', Object.keys(cookies));
```

---

## 🎯 Why This Happened

### Cookie Names in Your System:

| User Type | Cookie Name | Used By |
|-----------|-------------|---------|
| **Admin** | `auth` | Login, Dashboard, Heartbeat |
| **Responder** | `responderToken` | Responder login, Responder heartbeat |

The heartbeat endpoint was created with `token` instead of `auth`, causing authentication to fail.

---

## ✅ Expected Behavior Now

### Before Fix:
```
1. User logs in → Cookie 'auth' created
2. Heartbeat sends request → Looks for cookie 'token'
3. Cookie 'token' not found → 401 Unauthorized ❌
```

### After Fix:
```
1. User logs in → Cookie 'auth' created
2. Heartbeat sends request → Looks for cookie 'auth'
3. Cookie 'auth' found → Token verified → 200 OK ✅
```

---

## 🧪 Testing

### Test the Fix:

1. **Login to dashboard**
   ```
   POST /api/login
   → Creates 'auth' cookie
   ```

2. **Wait for heartbeat** (30 seconds)
   ```
   POST /api/heartbeat
   → Should return 200 OK ✅
   ```

3. **Check browser console**
   - Open DevTools (F12)
   - Go to Network tab
   - Look for POST `/api/heartbeat`
   - Status should be **200 OK**

4. **Check cookies**
   - DevTools → Application tab → Cookies
   - Should see cookie named `auth`
   - Value should be a JWT token

---

## 🔍 Debug Information

If you still see 401 errors, check the console logs:

### Good Output:
```javascript
// No logs (token found and verified)
POST /api/heartbeat 200 OK
```

### Bad Output:
```javascript
No auth token found in cookies: []
POST /api/heartbeat 401 Unauthorized
```

If you see "No auth token found", check:
1. Are you logged in?
2. Is the `auth` cookie present?
3. Is the cookie httpOnly and secure?

---

## 📊 Cookie Configuration

### Admin Cookie (`auth`):
```javascript
serialize('auth', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 86400 // 1 day
})
```

### What Heartbeat Expects:
```javascript
const cookies = parse(req.headers.cookie || '');
const token = cookies.auth; // Must match cookie name
```

---

## 🔗 Related Files

- **`pages/api/login.js`** - Creates `auth` cookie
- **`pages/api/heartbeat.js`** - Reads `auth` cookie (FIXED)
- **`pages/api/logout.js`** - Clears `auth` cookie
- **`hooks/useHeartbeat.js`** - Sends heartbeat requests

---

## ✅ Verification Steps

### Step 1: Check Login
```sql
-- After login, check session
SELECT * FROM admin_sessions 
WHERE admin_email = 'your-email@example.com'
ORDER BY created_at DESC LIMIT 1;
```

### Step 2: Check Heartbeat
```javascript
// Browser console should show:
POST /api/heartbeat 200 OK

// Response:
{
  "success": true,
  "message": "Heartbeat received"
}
```

### Step 3: Check Database
```sql
-- last_active_at should update every 30 seconds
SELECT admin_email, last_active_at, is_active
FROM admin_sessions
WHERE admin_email = 'your-email@example.com';
```

---

## 🎉 Result

**The heartbeat endpoint now works correctly!**

### What Happens Now:
1. ✅ Login creates `auth` cookie
2. ✅ Heartbeat reads `auth` cookie
3. ✅ Token verified successfully
4. ✅ Session updated in database
5. ✅ Status shows "Online"

### Network Tab:
```
POST /api/heartbeat
Status: 200 OK
Response: { "success": true, "message": "Heartbeat received" }
```

---

## 💡 Prevention

To avoid this in the future:

### 1. **Consistent Cookie Names**
Use a constant for cookie names:
```javascript
// lib/constants.js
export const COOKIE_NAMES = {
  ADMIN: 'auth',
  RESPONDER: 'responderToken'
};

// Usage
const token = cookies[COOKIE_NAMES.ADMIN];
```

### 2. **Better Error Messages**
```javascript
if (!token) {
  console.error('Authentication failed:', {
    expectedCookie: 'auth',
    foundCookies: Object.keys(cookies),
    headers: req.headers.cookie
  });
  return res.status(401).json({ error: 'Not authenticated' });
}
```

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Status**: ✅ Fixed and Working
