# Notification System Upgrade - Alert Notifications Separation

## Overview
This upgrade separates **alert/emergency notifications** from **regular notifications** (chat, admin, system) by creating a dedicated `alert_notifications` table.

## Why This Change?

### Problems with Single Table:
- ❌ Mixed emergency alerts with casual chat messages
- ❌ Hard to prioritize critical notifications
- ❌ No acknowledgment tracking for emergencies
- ❌ No severity levels for alerts
- ❌ Difficult to query and filter

### Benefits of Separate Tables:
- ✅ **Clear separation** - Emergency alerts are distinct from regular notifications
- ✅ **Better performance** - Faster queries with smaller, focused tables
- ✅ **Enhanced features** - Severity levels, acknowledgment tracking
- ✅ **Easier management** - Different retention policies, archiving strategies
- ✅ **Scalability** - Can add alert-specific features without affecting regular notifications

---

## Database Changes

### New Table: `alert_notifications`

```sql
CREATE TABLE alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id UUID NOT NULL,                    -- Links to alerts table
    account_type VARCHAR(20) NOT NULL,         -- 'admin' or 'responder'
    account_id INTEGER NOT NULL,
    sender_type VARCHAR(20) DEFAULT 'alerts1',
    sender_id INTEGER,
    sender_name VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',     -- NEW: 'low', 'medium', 'high', 'critical'
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,     -- NEW: Acknowledgment tracking
    acknowledged_at TIMESTAMP WITH TIME ZONE,  -- NEW: When acknowledged
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: `notifications`

The `notifications` table now only handles:
- **Chat messages** (`sender_type = 'chat'`)
- **Admin notifications** (`sender_type = 'admin'`)
- **System notifications** (`sender_type = 'system'`)

**Removed from notifications:**
- `sender_type = 'responder'` → Now in `alert_notifications`
- `sender_type = 'alerts1'` → Now in `alert_notifications`

---

## API Changes

### New Endpoint: `/api/notifications/alerts`

**GET** - Fetch alert notifications
```javascript
// Get all alert notifications
fetch('/api/notifications/alerts?showAll=true')

// Get alert notifications for specific user
fetch('/api/notifications/alerts?userId=1&accountType=admin')
```

**POST** - Mark alert notification as read
```javascript
fetch('/api/notifications/alerts', {
  method: 'POST',
  body: JSON.stringify({ notificationId: 123 })
})
```

**PUT** - Mark all alert notifications as read
```javascript
fetch('/api/notifications/alerts', {
  method: 'PUT',
  body: JSON.stringify({ userId: 1, accountType: 'admin' })
})
```

**PATCH** - Acknowledge alert notification (NEW!)
```javascript
fetch('/api/notifications/alerts', {
  method: 'PATCH',
  body: JSON.stringify({ notificationId: 123 })
})
```

### Existing Endpoint: `/api/notifications`

Remains unchanged - handles regular notifications (chat, admin, system)

---

## Code Changes

### 1. Alert Verification (`app/api/alerts/verify/route.js`)

**Before:**
```javascript
// Inserted into notifications table
INSERT INTO notifications (account_type, account_id, sender_type, ...)
```

**After:**
```javascript
// Inserts into alert_notifications table with severity
INSERT INTO alert_notifications (alert_id, account_type, account_id, severity, ...)
```

### 2. Frontend Components (TODO)

You'll need to update these components to fetch from both endpoints:

#### DashboardContent.js
```javascript
// Fetch regular notifications
const regularNotifs = await fetch('/api/notifications?showAll=true');

// Fetch alert notifications
const alertNotifs = await fetch('/api/notifications/alerts?showAll=true');

// Combine or handle separately
const allNotifications = [...regularNotifs, ...alertNotifs];
```

#### Inbox.js
```javascript
// Add filter for alert notifications
const [notificationType, setNotificationType] = useState('all'); // 'all', 'alerts', 'regular'

// Fetch based on filter
useEffect(() => {
  if (notificationType === 'alerts' || notificationType === 'all') {
    fetchAlertNotifications();
  }
  if (notificationType === 'regular' || notificationType === 'all') {
    fetchRegularNotifications();
  }
}, [notificationType]);
```

---

## Migration Steps

### Step 1: Run Database Migration
```bash
psql -U your_username -d your_database -f database/migrations/create_alert_notifications_table.sql
```

### Step 2: Verify Tables
```sql
-- Check alert_notifications table
SELECT * FROM alert_notifications LIMIT 5;

-- Check notifications constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notifications_sender_type_check';
```

### Step 3: (Optional) Migrate Existing Data

If you want to move existing alert notifications from `notifications` to `alert_notifications`:

1. Uncomment the migration section in `create_alert_notifications_table.sql`
2. Run the migration again
3. Verify data was moved correctly
4. Delete old alert notifications from `notifications` table

### Step 4: Update Frontend Code

Update components to use the new API endpoint:
- [ ] `DashboardContent.js` - Fetch from both endpoints
- [ ] `Inbox.js` - Add filter for alert vs regular notifications
- [ ] Add severity badges for alert notifications
- [ ] Add acknowledgment button for critical alerts

---

## Features to Implement

### 1. Severity-Based Styling
```javascript
const getSeverityColor = (severity) => {
  switch(severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};
```

### 2. Acknowledgment Tracking
```javascript
const handleAcknowledge = async (notificationId) => {
  await fetch('/api/notifications/alerts', {
    method: 'PATCH',
    body: JSON.stringify({ notificationId })
  });
  // Update UI to show acknowledged status
};
```

### 3. Alert Notification Badge
```javascript
// Show separate counts for alerts vs regular notifications
<div className="notification-badges">
  <span className="alert-badge">{alertCount}</span>
  <span className="regular-badge">{regularCount}</span>
</div>
```

### 4. Sound Alerts for Critical Notifications
```javascript
useEffect(() => {
  const criticalAlerts = alertNotifications.filter(n => 
    n.severity === 'critical' && !n.is_read
  );
  
  if (criticalAlerts.length > 0) {
    playAlertSound();
  }
}, [alertNotifications]);
```

---

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Alert notifications are created when alerts are verified
- [ ] Regular notifications still work (chat, admin, system)
- [ ] Can fetch alert notifications via API
- [ ] Can mark alert notifications as read
- [ ] Can acknowledge alert notifications
- [ ] Severity levels are correctly assigned
- [ ] Foreign key constraints work properly
- [ ] Indexes improve query performance

---

## Rollback Plan

If you need to rollback:

```sql
-- 1. Drop the new table
DROP TABLE IF EXISTS alert_notifications CASCADE;

-- 2. Restore old notifications constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_sender_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_sender_type_check 
    CHECK (sender_type IN ('admin', 'responder', 'system', 'chat', 'alerts1'));

-- 3. Delete the new API file
-- Delete: pages/api/notifications/alerts.js

-- 4. Revert changes to app/api/alerts/verify/route.js
```

---

## Future Enhancements

1. **Escalation System** - Auto-escalate unacknowledged critical alerts
2. **Alert History** - Track all alert notifications per incident
3. **Notification Templates** - Predefined messages for different alert types
4. **Delivery Status** - Track if notification was successfully delivered
5. **Batch Operations** - Acknowledge multiple alerts at once
6. **Alert Analytics** - Response time metrics, acknowledgment rates

---

## Questions?

If you have questions about this upgrade:
1. Check the migration SQL file for detailed comments
2. Review the new API endpoint code
3. Test with sample data before production deployment
