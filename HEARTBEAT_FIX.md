# Heartbeat Reliability Fix

## Problem
Users were appearing as offline when opening modals or switching tabs, even though they were still active on the site.

## Root Causes Identified

### 1. **Browser Tab Throttling**
- When modals open or tabs lose focus, browsers throttle `setInterval` timers
- Background tabs can have intervals delayed by 1000ms or more
- This caused heartbeat requests to be skipped or delayed

### 2. **Missing CSP Directive**
- Content Security Policy was missing `connect-src` directive
- This could block fetch/XHR requests including heartbeat API calls
- Browsers may silently fail these requests

### 3. **No Visibility API Handling**
- Heartbeat didn't respond to page visibility changes
- No recovery mechanism when page regained focus
- Missed heartbeats when user switched back to the tab

### 4. **No Retry Logic**
- Single network failures would mark users as offline
- No attempt to recover from temporary network issues

## Solutions Implemented

### 1. Enhanced Heartbeat Hook (`hooks/useHeartbeat.js`)

#### **Added Visibility API Support**
```javascript
// Detects when page becomes visible again
document.addEventListener('visibilitychange', handleVisibilityChange);

// Sends immediate heartbeat when page regains visibility
if (!document.hidden) {
  sendHeartbeat();
}
```

#### **Added Focus Event Handling**
```javascript
// Detects when window regains focus
window.addEventListener('focus', handleFocus);

// Sends heartbeat if enough time has passed
if (timeSinceLastHeartbeat >= interval) {
  sendHeartbeat();
}
```

#### **Added requestAnimationFrame (RAF)**
```javascript
// More reliable than setInterval for timing
const scheduleCheck = () => {
  checkAndSendHeartbeat();
  rafRef.current = requestAnimationFrame(scheduleCheck);
};
```

Benefits:
- RAF runs at 60fps when page is visible
- Automatically pauses when page is hidden
- Resumes immediately when page becomes visible

#### **Added Retry Logic**
```javascript
// Retries once if heartbeat fails
if (!response.ok && retryCount < 1) {
  setTimeout(() => sendHeartbeat(retryCount + 1), 2000);
}
```

#### **Added keepalive Flag**
```javascript
fetch(endpoint, {
  keepalive: true, // Ensures request completes even if page closes
});
```

### 2. Fixed CSP in Middleware (`middleware.js`)

#### **Added connect-src Directive**
```javascript
connect-src 'self' https: wss:;
```

This allows:
- ✅ Fetch requests to same origin (heartbeat API)
- ✅ HTTPS connections to external APIs
- ✅ WebSocket connections (for future real-time features)

## How It Works Now

### Normal Operation
1. Heartbeat sends every 30 seconds via `setInterval`
2. RAF checks timing every frame (when visible)
3. Both mechanisms ensure heartbeat is sent on time

### When Modal Opens
1. Page remains visible, RAF continues running
2. Heartbeat continues normally
3. No interruption to online status

### When Tab Loses Focus
1. RAF automatically pauses (browser behavior)
2. `setInterval` may be throttled but still runs
3. When tab regains focus:
   - Focus event fires
   - Immediate heartbeat sent if needed
   - RAF resumes normal operation

### When Page Hidden (Different Tab)
1. RAF pauses automatically
2. `setInterval` heavily throttled (1000ms+)
3. When page becomes visible:
   - Visibility change event fires
   - Immediate heartbeat sent
   - RAF resumes
   - User stays online

### Network Failure
1. First attempt fails
2. Automatic retry after 2 seconds
3. If retry succeeds, user stays online
4. Only marked offline if both attempts fail

## Testing Checklist

Test these scenarios to verify the fix:

- [ ] **Open Modal**: User should stay online
- [ ] **Switch Tabs**: User should stay online when returning
- [ ] **Minimize Window**: User should stay online when restored
- [ ] **Slow Network**: Retry should keep user online
- [ ] **Long Idle**: User should reconnect when active again
- [ ] **Multiple Modals**: Opening several modals shouldn't affect status

## Monitoring

Check browser console for these messages:
- `"Page visible, sending heartbeat"` - When tab becomes visible
- `"Page focused, sending heartbeat"` - When window gains focus
- `"Heartbeat failed: [status]"` - If heartbeat fails (should retry)
- `"Heartbeat error: [error]"` - Network errors (should retry)

## Performance Impact

### Before
- Single `setInterval` timer
- No visibility handling
- No retry logic
- ~1 request per 30 seconds

### After
- `setInterval` + RAF (pauses when hidden)
- Visibility and focus event listeners
- Retry logic (max 2 attempts)
- ~1-2 requests per 30 seconds (only 2 if retry needed)

**Impact**: Minimal - RAF pauses automatically when hidden, events are lightweight

## Browser Compatibility

✅ **Supported:**
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- All modern mobile browsers

✅ **Features Used:**
- Page Visibility API (widely supported)
- requestAnimationFrame (universal support)
- fetch with keepalive (Chrome 66+, Firefox 65+)

## Troubleshooting

### Users Still Going Offline?

1. **Check CSP in Browser Console**
   ```
   Look for: "Refused to connect to..."
   Solution: Verify connect-src is in CSP
   ```

2. **Check Network Tab**
   ```
   Filter: /api/heartbeat
   Should see: Regular POST requests every 30s
   ```

3. **Check Server Logs**
   ```
   Verify: Heartbeat endpoint is receiving requests
   Check: Database is updating last_active_at
   ```

4. **Check Session Timeout**
   ```sql
   -- Verify session timeout settings
   SELECT admin_email, last_active_at, 
          NOW() - last_active_at as time_since_heartbeat
   FROM admin_sessions 
   WHERE is_active = true;
   ```

### Debug Mode

Add this to see detailed heartbeat activity:
```javascript
// In useHeartbeat.js, add console.log
const sendHeartbeat = async (retryCount = 0) => {
  console.log('[Heartbeat] Sending...', new Date().toISOString());
  // ... rest of code
};
```

## Future Improvements

Consider adding:
1. **Exponential backoff** for retries
2. **WebSocket fallback** for real-time status
3. **Service Worker** for background heartbeats
4. **Beacon API** for page unload heartbeats
5. **Server-side timeout adjustment** based on client activity patterns

## Related Files

- `hooks/useHeartbeat.js` - Main heartbeat logic
- `middleware.js` - CSP and security headers
- `pages/api/heartbeat.js` - Admin heartbeat endpoint
- `pages/api/responders/heartbeat.js` - Responder heartbeat endpoint
- `components/DashboardContent.js` - Uses heartbeat hook
