# NEW Badge & Toggle Expand Feature

## Overview

Added two new features to improve the alert management UI:
1. **NEW Badge** - Shows on alerts created within the last 5 minutes
2. **Toggle Expand** - Click again to minimize expanded alerts in VerifyIncidents

---

## Features Added

### 1. NEW Badge for Recent Alerts

**Displays on:**
- ✅ VerifyIncidents component
- ✅ AlertsMap component (cluster popups)
- ✅ AlertList component

**Criteria:**
- Alert must be created within **last 5 minutes**
- Uses `created_at` timestamp
- Automatically disappears after 5 minutes

**Visual:**
```
🚨 Fire Emergency [NEW]
```
- Green background (#10B981)
- White text
- Pulsing animation
- Tiny badge (9px font)

---

### 2. Toggle Expand in VerifyIncidents

**Before:**
- Click alert → Expands
- Click another alert → Switches to that one
- No way to minimize

**After:**
- Click alert → Expands
- Click same alert again → Minimizes ✅
- Click different alert → Switches to that one

---

## Changes Made

### 1. VerifyIncidents.js

#### Toggle Expand (Line 199):

**Before:**
```javascript
onClick={() => setSelectedAlert(alert)}
```

**After:**
```javascript
onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
```

**How it works:**
- If clicking the same alert → Set to `null` (minimize)
- If clicking different alert → Set to that alert (expand)

---

#### NEW Badge (Lines 211-216):

```javascript
<h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1">
  <span className="text-red-600">🚨</span>
  {alert.type || 'Emergency'}
  {/* NEW badge for alerts created within last 5 minutes */}
  {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
    <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
      NEW
    </span>
  )}
</h3>
```

---

### 2. AlertsMap.js

#### NEW Badge in Cluster Popups (Lines 564-571):

```javascript
<h4 className="font-semibold text-sm text-gray-900 mb-1.5 flex items-center gap-1.5">
  {alert.type || 'Alert'}
  {/* NEW badge for alerts created within last 5 minutes */}
  {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
    <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
      NEW
    </span>
  )}
</h4>
```

---

### 3. AlertList.js

#### NEW Badge in Alert Cards (Lines 146-154):

```javascript
<span className="font-medium text-gray-700 flex items-center gap-1.5">
  {alert.type || 'Emergency'}
  {/* NEW badge for alerts created within last 5 minutes */}
  {alert.created_at && (new Date() - new Date(alert.created_at)) < 5 * 60 * 1000 && (
    <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">
      NEW
    </span>
  )}
</span>
```

---

## How NEW Badge Works

### Time Calculation:

```javascript
(new Date() - new Date(alert.created_at)) < 5 * 60 * 1000
```

**Breakdown:**
- `new Date()` - Current time
- `new Date(alert.created_at)` - Alert creation time
- Difference in milliseconds
- `5 * 60 * 1000` = 300,000ms = 5 minutes

**Example:**
```
Current time: 2:05 PM
Alert created: 2:02 PM
Difference: 3 minutes
Result: Show NEW badge ✅

Current time: 2:10 PM
Alert created: 2:02 PM
Difference: 8 minutes
Result: No badge ❌
```

---

## Visual Examples

### VerifyIncidents - Before Click:

```
┌─────────────────────────────────────┐
│ 🚨 Fire Emergency [NEW]             │
│ John Doe                            │
│ 📍 123 Main St                      │
│ ⏰ 2 minutes ago                    │
└─────────────────────────────────────┘
```

### VerifyIncidents - After Click (Expanded):

```
┌─────────────────────────────────────┐
│ 🚨 Fire Emergency [NEW]             │
│ John Doe                            │
│ 📍 123 Main St                      │
│ ⏰ 2 minutes ago                    │
├─────────────────────────────────────┤
│ [View Location] [Notify]            │
│                                     │
│ ✅ Verify & Dispatch                │
│ 🚫 Reject Alert                     │
│ 📤 Refer to Authority               │
└─────────────────────────────────────┘
```

### VerifyIncidents - Click Again (Minimized):

```
┌─────────────────────────────────────┐
│ 🚨 Fire Emergency [NEW]             │
│ John Doe                            │
│ 📍 123 Main St                      │
│ ⏰ 2 minutes ago                    │
└─────────────────────────────────────┘
```

---

### AlertsMap - Cluster Popup:

```
┌─────────────────────────────────────┐
│ 3 Incidents in This Area            │
├─────────────────────────────────────┤
│ Fire Emergency [NEW]                │
│ ⚠ UNVERIFIED | 🔴 HIGH              │
│ 123 Main St                         │
├─────────────────────────────────────┤
│ Medical Emergency                   │
│ ✓ VERIFIED | 🟡 MEDIUM              │
│ 456 Oak Ave                         │
└─────────────────────────────────────┘
```

---

### AlertList - Alert Card:

```
┌─────────────────────────────────────┐
│ John Doe                            │
│ 📞 09123456789                      │
│                                     │
│ Fire Emergency [NEW] • 2:05 PM      │
│                                     │
│ ✓ VERIFIED | 🔴 HIGH | 🚨 URGENT   │
│                                     │
│ 📍 123 Main St, Barangay 1          │
└─────────────────────────────────────┘
```

---

## User Experience

### Toggle Expand Flow:

```
User sees unverified alert
       ↓
Clicks on alert card
       ↓
Card expands with action buttons ✅
       ↓
User clicks same card again
       ↓
Card minimizes (collapses) ✅
       ↓
User can click to expand again
```

---

### NEW Badge Flow:

```
Alert created at 2:00 PM
       ↓
Badge shows: [NEW] (pulsing green)
       ↓
Time passes...
       ↓
2:04 PM - Still showing [NEW] ✅
       ↓
2:06 PM - Badge disappears ❌ (>5 min)
```

---

## Benefits

### Toggle Expand:
- ✅ **Better UX** - Can minimize to see more alerts
- ✅ **Less clutter** - Close expanded view when done
- ✅ **Intuitive** - Click to toggle (common pattern)
- ✅ **Flexible** - Expand/collapse as needed

### NEW Badge:
- ✅ **Immediate attention** - Highlights fresh alerts
- ✅ **Visual priority** - Pulsing green stands out
- ✅ **Auto-expires** - Disappears after 5 minutes
- ✅ **Consistent** - Shows in all alert views
- ✅ **No manual tracking** - Automatic based on timestamp

---

## Testing

### Test 1: NEW Badge Appears
1. Create a new alert
2. **Expected:** Badge shows with pulsing animation
3. Check VerifyIncidents, AlertsMap, and AlertList
4. **Expected:** Badge appears in all three

### Test 2: NEW Badge Disappears
1. Wait 5 minutes after alert creation
2. **Expected:** Badge automatically disappears
3. Refresh page
4. **Expected:** Badge still gone (based on timestamp)

### Test 3: Toggle Expand
1. Click an unverified alert
2. **Expected:** Card expands with action buttons
3. Click the same alert again
4. **Expected:** Card collapses/minimizes
5. Click again
6. **Expected:** Card expands again

### Test 4: Switch Between Alerts
1. Click Alert A
2. **Expected:** Alert A expands
3. Click Alert B
4. **Expected:** Alert A collapses, Alert B expands
5. Click Alert B again
6. **Expected:** Alert B collapses

---

## Technical Details

### Time Comparison:
```javascript
// Current time - Alert creation time
const timeDiff = new Date() - new Date(alert.created_at);

// 5 minutes in milliseconds
const fiveMinutes = 5 * 60 * 1000; // 300,000ms

// Show badge if less than 5 minutes
if (timeDiff < fiveMinutes) {
  // Show NEW badge
}
```

### Toggle Logic:
```javascript
// If same alert clicked, set to null (minimize)
// Otherwise, set to clicked alert (expand/switch)
setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)
```

---

## Styling

### NEW Badge CSS:
```css
px-1.5 py-0.5          /* Padding */
bg-green-500           /* Green background */
text-white             /* White text */
text-[9px]             /* Tiny font (9px) */
font-bold              /* Bold weight */
rounded                /* Rounded corners */
animate-pulse          /* Pulsing animation */
```

### Pulsing Animation:
- Tailwind's `animate-pulse` class
- Fades in/out smoothly
- Draws attention without being annoying

---

## Summary

✅ **NEW Badge:** Shows on alerts <5 minutes old
✅ **Pulsing Animation:** Green badge with pulse effect
✅ **Auto-Expires:** Disappears after 5 minutes
✅ **Toggle Expand:** Click again to minimize in VerifyIncidents
✅ **Consistent:** Badge appears in all alert views
✅ **Better UX:** More intuitive alert management

**Admins can now easily spot new alerts and toggle expanded views!** 🎉
