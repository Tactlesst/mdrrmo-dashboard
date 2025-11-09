# Alert Verification Workflow

## Overview
The MDRRMO Dashboard implements a clear two-stage workflow for handling incoming alerts:

1. **Unverified Alerts** → VerifyIncidents Component
2. **Verified Alerts** → AlertList Component

---

## Workflow Stages

### Stage 1: Verification (VerifyIncidents)
**Location:** Left panel / Top section (mobile)

**Purpose:** Review and verify incoming alerts before dispatching responders

**Features:**
- ✅ Shows ONLY unverified alerts (`is_verified = false`)
- 🔍 Admin reviews incident details
- 📍 **View Location** button to see alert on map
- 💡 Smart detection for non-car accidents with referral suggestions
- ✓ **Verify** - Approve and send to responders
- ✗ **Reject** - Dismiss false/spam reports
- 🔄 **Refer & Verify** - Send to other authorities (Police, Fire, etc.)

**Actions:**
```
Verify → Alert moves to AlertList (is_verified = true)
Reject → Alert is removed from system
Refer → Alert marked as "Referred" and sent to external authority
```

---

### Stage 2: Active Response (AlertList)
**Location:** Right panel / Bottom section (mobile)

**Purpose:** Monitor and manage verified alerts being handled by responders

**Features:**
- ✅ Shows ONLY verified alerts (`is_verified = true`)
- 📊 Status badges: Verification, Response Status, Severity
- 🚨 Visual indicators: New alerts, Pending, In Progress
- 📍 **Locate** button to view on map
- 🚑 Real-time ETA and responder tracking
- 📄 Pagination for large alert volumes

**Filtered Out:**
- ❌ Unverified alerts (stay in VerifyIncidents)
- ❌ Responded alerts (completed)
- ❌ Referred alerts (sent to other authorities)

---

## Alert Status Flow

```
┌─────────────────┐
│  New Alert      │
│  (Unverified)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   VerifyIncidents Panel     │
│   - Review details          │
│   - View on map             │
│   - Check if car accident   │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Verify │ │  Reject  │
└───┬────┘ └────┬─────┘
    │           │
    │           ▼
    │      [Removed]
    │
    ▼
┌─────────────────────────────┐
│      AlertList Panel        │
│   - Monitor response        │
│   - Track responders        │
│   - View ETA                │
└────────┬────────────────────┘
         │
         ▼
    [Responded]
```

---

## Referral System (Non-Car Accidents)

When an alert is **NOT** a car accident:

1. VerifyIncidents shows suggestion: 💡 "This is not a car accident"
2. Admin clicks "Show referral options"
3. Selects appropriate authority:
   - Police Department (PNP)
   - Fire Department (BFP)
   - Medical Emergency (Hospital)
   - Barangay Officials
   - DPWH (Infrastructure)
   - Environmental Agency
   - Other Authority
4. Clicks **"Refer & Verify"**
5. System:
   - Verifies the alert
   - Sets status to "Referred"
   - Saves to `alert_referrals` table
   - Removes from both panels

---

## Database Fields

### `alerts` table
- `is_verified` (BOOLEAN) - Whether admin has verified the alert
- `status` (VARCHAR) - Current response status
  - "Not Responded"
  - "Ongoing"
  - "In Progress"
  - "Responded"
  - "Referred"
- `referred_to` (VARCHAR) - Authority alert was referred to
- `referred_at` (TIMESTAMP) - When alert was referred

### `alert_referrals` table
- `id` (SERIAL) - Primary key
- `alert_id` (UUID) - Foreign key to alerts
- `referred_to_authority` (VARCHAR) - Which authority
- `referral_notes` (TEXT) - Additional information
- `referred_at` (TIMESTAMP) - Referral timestamp
- `alert_type` (VARCHAR) - Type of incident
- `alert_address` (TEXT) - Location

---

## Benefits of This Workflow

✅ **Clear Separation** - Unverified vs Verified alerts
✅ **Prevents False Dispatches** - Admin reviews before sending responders
✅ **Efficient Routing** - Non-car accidents go to appropriate authorities
✅ **Clean Interface** - Each panel has a specific purpose
✅ **Better Tracking** - Easy to see what needs attention
✅ **Reduced Clutter** - Completed/referred alerts don't clog the list

---

## User Experience

### For Admins:
1. New alert arrives → Appears in **VerifyIncidents**
2. Click to review details
3. Click **View Location** to see on map
4. Decide: Verify, Reject, or Refer
5. If verified → Moves to **AlertList** for monitoring
6. Track responder progress in **AlertList**

### Visual Clarity:
- **VerifyIncidents** = "Inbox" (needs review)
- **AlertList** = "Active Cases" (being handled)
- **Map** = Visual overview of all verified alerts

---

## Implementation Files

- `components/VerifyIncidents.js` - Verification panel
- `components/AlertList.js` - Active alerts panel
- `components/Alerts.js` - Main container with filtering
- `app/api/alerts/verify/route.js` - Verification API
- `app/api/alerts/refer/route.js` - Referral API
- `database/migrations/add_alert_referrals.sql` - Database schema
