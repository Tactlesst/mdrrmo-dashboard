# Alert Sorting Update - Verified First, Then Unverified

## What Changed

Updated the alert sorting logic in the map to prioritize **verified alerts** over **unverified alerts**, with time-based sorting within each group.

---

## The New Sorting Order

### Priority 1: Verification Status
- ✅ **Verified alerts** appear first
- ⚠️ **Unverified alerts** appear last

### Priority 2: Time (Within Each Group)
- 📅 **Newest** alerts at the top
- 📅 **Oldest** alerts at the bottom

---

## File Updated

### `components/Alerts.js` - `mapAlerts` (Lines 123-132)

**Before:**
```javascript
const sorted = [...alerts].sort((a, b) => {
  const dateA = new Date(a.occurred_at);
  const dateB = new Date(b.occurred_at);
  return dateB - dateA; // Only sorted by time
});
```

**After:**
```javascript
const sorted = [...alerts].sort((a, b) => {
  // First priority: Verified alerts come before unverified
  if (a.is_verified && !b.is_verified) return -1;
  if (!a.is_verified && b.is_verified) return 1;
  
  // Second priority: Within same verification status, sort by time (newest first)
  const dateA = new Date(a.occurred_at);
  const dateB = new Date(b.occurred_at);
  return dateB - dateA;
});
```

---

## How It Works

### Example Alert List:

**Before (Only Time Sorting):**
```
1. 🚨 Fire - 2:00 PM (Unverified) ⚠️
2. 🚨 Flood - 1:45 PM (Verified) ✅
3. 🚨 Accident - 1:30 PM (Verified) ✅
4. 🚨 Medical - 1:15 PM (Unverified) ⚠️
5. 🚨 Crime - 1:00 PM (Verified) ✅
```
**Problem:** Unverified alerts mixed with verified ones!

---

**After (Verification + Time Sorting):**
```
✅ VERIFIED ALERTS (Newest First):
1. 🚨 Flood - 1:45 PM (Verified) ✅
2. 🚨 Accident - 1:30 PM (Verified) ✅
3. 🚨 Crime - 1:00 PM (Verified) ✅

⚠️ UNVERIFIED ALERTS (Newest First):
4. 🚨 Fire - 2:00 PM (Unverified) ⚠️
5. 🚨 Medical - 1:15 PM (Unverified) ⚠️
```
**Better:** Verified alerts prioritized, unverified at the bottom!

---

## Visual Representation

### Map Display Order:

```
┌─────────────────────────────────────┐
│  MAP VIEW                           │
├─────────────────────────────────────┤
│                                     │
│  ✅ Verified Alert 1 (Today 2:00 PM)│  ← Newest verified
│  ✅ Verified Alert 2 (Today 1:30 PM)│
│  ✅ Verified Alert 3 (Today 1:00 PM)│
│  ✅ Verified Alert 4 (Yesterday)    │  ← Oldest verified
│                                     │
│  ⚠️ Unverified Alert 1 (Today 3:00) │  ← Newest unverified
│  ⚠️ Unverified Alert 2 (Today 2:30) │
│  ⚠️ Unverified Alert 3 (Yesterday)  │  ← Oldest unverified
│                                     │
└─────────────────────────────────────┘
```

---

## Sorting Logic Breakdown

### Step 1: Compare Verification Status
```javascript
if (a.is_verified && !b.is_verified) return -1; // a comes first
if (!a.is_verified && b.is_verified) return 1;  // b comes first
```

**Result:**
- Verified alert vs Unverified alert → Verified wins
- Unverified alert vs Verified alert → Verified wins

---

### Step 2: Compare Time (If Same Status)
```javascript
const dateA = new Date(a.occurred_at);
const dateB = new Date(b.occurred_at);
return dateB - dateA; // Newer date comes first
```

**Result:**
- Both verified → Newer one first
- Both unverified → Newer one first

---

## Benefits

### For Admins:
- ✅ **Focus on verified** - See dispatched alerts first
- ✅ **Track progress** - Verified alerts at top show what's being handled
- ✅ **Review unverified** - Unverified alerts at bottom need attention

### For Workflow:
- ✅ **Clear priority** - Verified = active response
- ✅ **Better organization** - Grouped by status
- ✅ **Time context** - Still sorted by time within groups

### For Map View:
- ✅ **Visual clarity** - Green badges (verified) at top
- ✅ **Easy scanning** - Gray badges (unverified) at bottom
- ✅ **Status awareness** - Clear separation of alert states

---

## Example Scenarios

### Scenario 1: New Alert Arrives (Unverified)

**Before:**
```
1. New Fire Alert (Unverified) ⚠️  ← Shows at top
2. Flood Alert (Verified) ✅
3. Medical Alert (Verified) ✅
```

**After:**
```
1. Flood Alert (Verified) ✅       ← Verified stay at top
2. Medical Alert (Verified) ✅
3. New Fire Alert (Unverified) ⚠️  ← Unverified at bottom
```

---

### Scenario 2: Admin Verifies an Alert

**Before:**
```
VERIFIED:
1. Flood Alert (1:45 PM) ✅
2. Medical Alert (1:30 PM) ✅

UNVERIFIED:
3. Fire Alert (2:00 PM) ⚠️  ← About to be verified
4. Crime Alert (1:15 PM) ⚠️
```

**After Verification:**
```
VERIFIED:
1. Fire Alert (2:00 PM) ✅  ← Moved to verified, newest time
2. Flood Alert (1:45 PM) ✅
3. Medical Alert (1:30 PM) ✅

UNVERIFIED:
4. Crime Alert (1:15 PM) ⚠️
```

---

### Scenario 3: Multiple Alerts Same Time

**Alerts:**
- Fire (2:00 PM, Verified)
- Flood (2:00 PM, Unverified)
- Medical (2:00 PM, Verified)

**Order:**
```
1. Fire (2:00 PM, Verified) ✅      ← Verified first
2. Medical (2:00 PM, Verified) ✅   ← Verified first
3. Flood (2:00 PM, Unverified) ⚠️   ← Unverified last
```

---

## Impact on Other Components

### AlertsMap.js
- ✅ Receives sorted alerts from `mapAlerts`
- ✅ Displays markers in correct order
- ✅ Cluster popups show verified first

### AlertList.js
- ✅ Uses `verifiedAlerts` (only verified)
- ✅ Already sorted by time
- ✅ No change needed

### VerifyIncidents.js
- ✅ Shows only unverified alerts
- ✅ Has its own sorting
- ✅ No change needed

---

## Testing

### Test 1: Create Mixed Alerts
1. Create 3 verified alerts (different times)
2. Create 3 unverified alerts (different times)
3. **Expected Order:**
   - Verified #1 (newest)
   - Verified #2
   - Verified #3 (oldest verified)
   - Unverified #1 (newest)
   - Unverified #2
   - Unverified #3 (oldest unverified)

### Test 2: Verify an Alert
1. Have 2 verified, 2 unverified alerts
2. Verify one of the unverified alerts
3. **Expected:** Newly verified alert moves to verified group

### Test 3: Time Sorting Within Groups
1. Create 3 verified alerts at different times
2. **Expected:** Newest verified at top, oldest verified at bottom
3. Create 3 unverified alerts at different times
4. **Expected:** Newest unverified at top (of unverified group)

---

## Code Comments

The sorting logic is now well-documented:

```javascript
// First priority: Verified alerts come before unverified
if (a.is_verified && !b.is_verified) return -1;
if (!a.is_verified && b.is_verified) return 1;

// Second priority: Within same verification status, sort by time (newest first)
const dateA = new Date(a.occurred_at);
const dateB = new Date(b.occurred_at);
return dateB - dateA;
```

---

## Summary

✅ **Updated:** Alert sorting to prioritize verified alerts
✅ **Order:** Verified first (newest to oldest), then unverified (newest to oldest)
✅ **Benefits:** Better organization, clearer priorities, easier to track
✅ **Impact:** Map view, cluster popups, alert list

**Verified alerts now appear at the top, unverified at the bottom!** 🎉

---

## Visual Example

### Map Markers (Top to Bottom):

```
📍 ✅ Flood Alert - Today 2:00 PM (Verified)
📍 ✅ Fire Alert - Today 1:30 PM (Verified)
📍 ✅ Medical Alert - Yesterday (Verified)
📍 ⚠️ Crime Alert - Today 3:00 PM (Unverified)
📍 ⚠️ Accident Alert - Today 2:30 PM (Unverified)
```

**Green badges (✅) at top, gray badges (⚠️) at bottom!**
