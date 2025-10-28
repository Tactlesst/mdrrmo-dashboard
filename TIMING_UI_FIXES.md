# Timing UI Fixes

## Issue
The time input field was displaying the time with AM/PM inside the input (e.g., "12:58 PM"), which was redundant with the separate AM/PM dropdown selector.

## Root Cause
The `extractTimeFromTimestamp()` function was converting the timestamp to 12-hour format, but HTML `<input type="time">` expects 24-hour format (HH:MM).

## Solution

### 1. Fixed Time Format
Changed the time extraction to use 24-hour format for the HTML time input:

**Before:**
```javascript
// Convert to 12-hour format
hours = hours % 12;
hours = hours ? hours : 12; // 0 should be 12
const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
```

**After:**
```javascript
// For the time input (24-hour format for HTML input type="time")
const hours24 = date.getHours();
const timeString = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
```

### 2. Simplified Labels
Removed redundant text from form labels:

**Before:**
- Label: "Time of Call (Responder Response):"
- Helper: "Auto-populated from alert time. When responders responded to the alert."
- Label: "Time Arrived at Scene (Resolution):"
- Helper: "When responders arrived and resolved the incident"

**After:**
- Label: "Time of Call:"
- Helper: "Auto-populated from alert time"
- Label: "Time Arrived at Scene:"
- Helper: "When responders arrived at the scene"

## Result

### Before Fix:
```
Time of Call (Responder Response):
┌─────────────┐  ┌────┐
│ 12:58 PM  ⏰│  │ AM ▼│  ← Redundant AM/PM display
└─────────────┘  └────┘
```

### After Fix:
```
Time of Call:
┌─────────────┐  ┌────┐
│ 12:58     ⏰│  │ PM ▼│  ← Clean display, single AM/PM selector
└─────────────┘  └────┘
```

## How It Works Now

1. **Alert timestamp** (e.g., "2025-10-28 12:58:45") is extracted
2. **Converted to 24-hour format** for time input: "12:58"
3. **AM/PM determined separately**: "PM" (because 12 >= 12)
4. **Time input shows**: "12:58" (in 24-hour format internally, displays as user's locale)
5. **Dropdown shows**: "PM"
6. **On submit**: Combined as "12:58 PM"

## Technical Details

### HTML Time Input Behavior
- `<input type="time">` expects value in 24-hour format (HH:MM)
- Browser displays it according to user's locale preferences
- Some browsers show 12-hour, some show 24-hour, but value is always 24-hour

### Our Implementation
- Store time in 24-hour format in the input field
- Store AM/PM separately in dropdown
- Combine them on form submission using `formatTimeToAMPM()`
- Save to database as "HH:MM AM/PM" format

## Files Modified
- `components/PCRForm.js`
  - `extractTimeFromTimestamp()` function
  - Form labels for Time of Call
  - Form labels for Time Arrived at Scene
