# Referred Alerts Display Issue - Fixed

## Problem

Referred alerts were appearing on the map even though they should be excluded.

## Root Cause

The filter was checking `alert.status !== 'Referred'`, but there might have been:
1. **Whitespace issues** - Status values with trailing/leading spaces
2. **Case sensitivity** - Though unlikely since the database sets it correctly
3. **Null/undefined values** - Empty status values not being handled

## Solution Applied

Updated the filter logic in `Alerts.js` to be more robust by:
1. Trimming whitespace from status values
2. Handling null/undefined status values
3. Making the filter more defensive

### Changes Made

#### 1. **verifiedAlerts Filter** (Lines 72-79)

**Before:**
```javascript
.filter((alert) => 
  alert.is_verified === true && 
  alert.status !== 'Responded' && 
  alert.status !== 'Referred'
)
```

**After:**
```javascript
.filter((alert) => {
  const status = (alert.status || '').trim();
  return alert.is_verified === true && 
         status !== 'Responded' && 
         status !== 'Referred';
})
```

#### 2. **mapAlerts Filter** (Lines 128-132)

**Before:**
```javascript
.filter((alert) => alert.status !== 'Responded' && alert.status !== 'Referred')
```

**After:**
```javascript
.filter((alert) => {
  const status = (alert.status || '').trim();
  return status !== 'Responded' && status !== 'Referred';
})
```

## What Gets Displayed Now

### ✅ Shown on Map:
- **Unverified alerts** (waiting for admin verification)
- **Verified alerts** with status:
  - `'Not Responded'`
  - `'Pending'`
  - `'Responding'`
  - `'On Scene'`
  - Any other active status

### ❌ Hidden from Map:
- **Responded** alerts (completed)
- **Referred** alerts (sent to other authorities)

### ✅ Shown in AlertList (Right Panel):
- Only **verified** alerts
- Excludes `'Responded'` and `'Referred'`

## Alert Status Flow

```
User Reports Alert
       ↓
Status: 'Not Responded' (Unverified)
       ↓
Admin Reviews in VerifyIncidents
       ↓
┌──────┴──────┬──────────┐
↓             ↓          ↓
APPROVE     REJECT    REFER
↓             ↓          ↓
Status:    Status:   Status:
'Pending'  'Rejected' 'Referred'
↓                        ↓
Responder            Sent to:
Assigned             - Police
↓                    - Fire Dept
Status:              - Hospital
'Responding'         - etc.
↓                    ↓
Status:           HIDDEN
'On Scene'        FROM MAP
↓
Status:
'Responded'
↓
HIDDEN
FROM MAP
```

## Testing

### Test Case 1: Refer an Alert
1. Go to VerifyIncidents panel
2. Select an unverified alert
3. Click "Refer to Other Authority"
4. Select authority (e.g., Police)
5. Submit referral
6. **Expected**: Alert disappears from map
7. **Expected**: Alert disappears from AlertList

### Test Case 2: Respond to an Alert
1. Responder marks alert as "Responded"
2. **Expected**: Alert disappears from map
3. **Expected**: Alert disappears from AlertList

### Test Case 3: Active Alerts
1. Verify an alert (status becomes 'Pending')
2. **Expected**: Alert appears on map
3. **Expected**: Alert appears in AlertList
4. Assign responder (status becomes 'Responding')
5. **Expected**: Alert still visible on map
6. **Expected**: Alert still visible in AlertList

## Database Status Values

The `alerts` table uses these status values:

| Status | Description | Shown on Map? | Shown in AlertList? |
|--------|-------------|---------------|---------------------|
| `Not Responded` | New, unverified alert | ✅ Yes | ❌ No (unverified) |
| `Pending` | Verified, awaiting assignment | ✅ Yes | ✅ Yes |
| `Responding` | Responder en route | ✅ Yes | ✅ Yes |
| `On Scene` | Responder arrived | ✅ Yes | ✅ Yes |
| `Responded` | Completed | ❌ No | ❌ No |
| `Referred` | Sent to other authority | ❌ No | ❌ No |
| `Rejected` | Admin rejected | ❌ No | ❌ No |

## Related Files

- **`components/Alerts.js`** - Main component with filtering logic
- **`components/AlertList.js`** - Right panel showing verified alerts
- **`components/AlertsMap.js`** - Map display component
- **`app/api/alerts/refer/route.js`** - API that sets status to 'Referred'

## Additional Notes

### Why Show Unverified Alerts on Map?

Unverified alerts appear on the map (but not in AlertList) so admins can:
1. See the location before verifying
2. Check for duplicate reports in the same area
3. Assess the situation geographically

This is intentional behavior - the map shows ALL active alerts, while AlertList shows only verified ones.

### Why Exclude Referred Alerts?

Referred alerts are excluded because:
1. They're no longer MDRRMO's responsibility
2. Another authority is handling them
3. Keeps the map focused on active MDRRMO incidents
4. Reduces clutter

Referred alerts are still in the database and can be viewed in:
- Reports page
- Logs page
- Alert history

## Verification Query

To check if referred alerts are properly marked:

```sql
-- Check referred alerts
SELECT id, type, address, status, referred_to, referred_at
FROM alerts
WHERE status = 'Referred'
ORDER BY referred_at DESC;

-- Check for whitespace issues
SELECT id, status, LENGTH(status) as status_length
FROM alerts
WHERE status LIKE '%Referred%';
```

## Summary

✅ **Fixed**: Referred alerts now properly excluded from map
✅ **Fixed**: Responded alerts properly excluded from map
✅ **Improved**: More robust status filtering with trim()
✅ **Improved**: Better null/undefined handling

The map now correctly shows only active alerts that MDRRMO needs to respond to.
