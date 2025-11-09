# Incident Verification System

## Overview
The Incident Verification System adds an additional layer of security and accuracy to the MDRRMO Alert System by requiring admin verification before incidents are dispatched to responders.

## Features

### 1. **Database Schema Updates**
- Added `is_verified` (BOOLEAN) - Tracks if incident has been verified
- Added `verified_by` (INTEGER) - References the admin who verified
- Added `verified_at` (TIMESTAMP) - When verification occurred
- Added `verification_notes` (TEXT) - Optional notes from admin

### 2. **Verification Workflow**
1. When a resident reports an incident, it's created with `is_verified = FALSE`
2. The incident appears in the "Verify Incidents" tab for admins
3. Admins can review incident details including:
   - Incident type and priority
   - Reporter information
   - Location and coordinates
   - Time reported
   - Description
4. Admins can either:
   - **Verify & Send to Responders** - Marks as verified and notifies all online responders
   - **Reject Incident** - Marks as verified but sets status to 'Rejected'

### 3. **User Interface**
- **Tab Navigation**: Switch between "Map & Alert List" and "Verify Incidents"
- **Verification Center**: 
  - Left panel: List of unverified incidents
  - Right panel: Detailed review and action buttons
  - Real-time updates every 30 seconds
  - Visual priority indicators (Critical, High, Medium, Low)

### 4. **API Endpoints**

#### GET `/api/alerts/unverified`
Fetches all unverified incidents for admin review.

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "uuid",
      "type": "Car Accident",
      "address": "123 Main St",
      "severity": "high",
      "occurred_at": "2025-11-07T09:00:00Z",
      "resident_name": "John Doe",
      "description": "Multi-vehicle collision"
    }
  ]
}
```

#### POST `/api/alerts/verify`
Verifies or rejects an incident.

**Request Body:**
```json
{
  "alertId": "uuid",
  "isApproved": true,
  "notes": "Verified via phone call with reporter"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Incident verified and sent to responders"
}
```

### 5. **Notification System Integration**
When an incident is verified:
- Status changes from "Not Responded" to "Pending"
- Notifications are sent to all online responders
- Notification includes incident type, location, and reporter info
- Uses `sender_type: 'alerts1'` for verified incidents

### 6. **Security Features**
- Admin authentication required for all verification actions
- Audit trail with `verified_by` and `verified_at` timestamps
- Optional verification notes for documentation
- Rejected incidents are marked but not deleted (for records)

## Database Migration

Run the SQL migration file to add verification fields:

```bash
psql -U your_user -d your_database -f migrations/add_verification_to_alerts.sql
```

Or execute directly in your database:

```sql
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES public.admins(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_alerts_is_verified ON public.alerts(is_verified);
CREATE INDEX IF NOT EXISTS idx_alerts_verified_at ON public.alerts(verified_at);
```

## Usage

### For Admins:
1. Navigate to the **Alerts** section in the dashboard
2. Click on the **"✅ Verify Incidents"** tab
3. Review pending incidents in the left panel
4. Click on an incident to see full details
5. Add optional verification notes
6. Click **"Verify & Send to Responders"** to approve or **"Reject Incident"** to decline

### For Developers:
- The `VerifyIncidents` component handles the UI
- API routes are in `/app/api/alerts/unverified` and `/app/api/alerts/verify`
- The system integrates seamlessly with existing alert and notification systems

## Benefits

1. **Reduces False Alarms**: Admins can verify incidents before dispatching responders
2. **Improves Response Efficiency**: Only legitimate incidents reach responders
3. **Audit Trail**: Complete record of who verified what and when
4. **Flexibility**: Optional notes allow admins to document verification process
5. **Real-time Updates**: Automatic refresh ensures admins see new incidents immediately

## Future Enhancements

- Add verification priority queue based on severity
- Implement automatic verification for trusted reporters
- Add verification statistics and reports
- Enable batch verification for multiple incidents
- Add verification time tracking and SLA monitoring
