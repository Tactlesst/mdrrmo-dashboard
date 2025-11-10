# Alert Notifications Migration - Step by Step Guide

## The Error You Encountered

```
ERROR: check constraint "notifications_sender_type_check" of relation "notifications" is violated by some row
```

**Why this happened:** You have existing notifications with `sender_type = 'responder'` or `'alerts1'` in the database, but the migration tried to update the constraint to exclude these values before moving the data.

## Solution: Run the Updated Migration

The migration file has been updated to:
1. ✅ Count existing alert notifications
2. ✅ Migrate them to the new `alert_notifications` table
3. ✅ Delete them from the old `notifications` table
4. ✅ THEN update the constraint (no more errors!)

---

## Step-by-Step Instructions

### Option 1: Using psql Command Line

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i database/migrations/create_alert_notifications_table.sql

# Check the output for NOTICE messages showing migration progress
```

### Option 2: Using pgAdmin or Database GUI

1. Open your database tool (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open a new SQL query window
4. Copy the entire contents of `database/migrations/create_alert_notifications_table.sql`
5. Execute the script
6. Check the "Messages" tab for migration status

### Option 3: Using Node.js Script

```javascript
// run-migration.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'database/migrations/create_alert_notifications_table.sql'),
      'utf8'
    );
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
```

Run with: `node run-migration.js`

---

## What the Migration Does

### Step 1: Create New Table
Creates `alert_notifications` table with:
- `alert_id` (UUID) - Links to alerts
- `severity` - Low/Medium/High/Critical
- `is_acknowledged` - Track acknowledgments
- All other notification fields

### Step 2: Count Existing Data
```sql
NOTICE: Found X alert notifications to migrate
```

### Step 3: Migrate Data
Moves all notifications with `sender_type IN ('responder', 'alerts1')` from `notifications` to `alert_notifications`

### Step 4: Delete Old Data
Removes migrated records from `notifications` table

### Step 5: Update Constraint
Now safe to update the constraint since no alert notifications remain

### Step 6: Verify
```sql
NOTICE: Migration complete: X alert notifications in new table
NOTICE: Remaining alert notifications in old table: 0
```

---

## Verification Queries

After running the migration, verify everything worked:

```sql
-- 1. Check new table has data
SELECT COUNT(*) as alert_notification_count 
FROM alert_notifications;

-- 2. Verify no alert notifications remain in old table
SELECT COUNT(*) as remaining_alert_notifs 
FROM notifications 
WHERE sender_type IN ('responder', 'alerts1');
-- Should return 0

-- 3. Check constraint is updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notifications_sender_type_check';
-- Should show: CHECK (sender_type IN ('admin', 'system', 'chat'))

-- 4. View sample migrated data
SELECT 
    id,
    alert_id,
    sender_name,
    recipient_name,
    severity,
    is_read,
    created_at
FROM alert_notifications
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check regular notifications still work
SELECT COUNT(*) as regular_notification_count
FROM notifications
WHERE sender_type IN ('admin', 'system', 'chat');
```

---

## Troubleshooting

### Issue: "relation 'alerts' does not exist"
**Solution:** Make sure your alerts table exists before running this migration.

### Issue: "column 'alert_id' cannot be null"
**Solution:** The migration tries to match notifications to alerts. If no alerts exist, it will fail. Create at least one alert first.

### Issue: Migration runs but some notifications not migrated
**Solution:** Check if those notifications couldn't be matched to any alert. Run:
```sql
SELECT * FROM notifications WHERE sender_type IN ('responder', 'alerts1');
```

### Issue: Want to rollback the migration
**Solution:** Run this rollback script:
```sql
-- Rollback: Move data back and restore old constraint
INSERT INTO notifications (
    account_type, account_id, sender_type, sender_id,
    sender_name, recipient_name, message, is_read,
    created_at, updated_at
)
SELECT 
    account_type, account_id, sender_type, sender_id,
    sender_name, recipient_name, message, is_read,
    created_at, updated_at
FROM alert_notifications;

DROP TABLE alert_notifications CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_sender_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_sender_type_check 
    CHECK (sender_type IN ('admin', 'responder', 'system', 'chat', 'alerts1'));
```

---

## Next Steps After Migration

1. ✅ Verify migration completed successfully
2. ✅ Test that new alert notifications are created in `alert_notifications` table
3. ✅ Update frontend to fetch from `/api/notifications/alerts`
4. ✅ Add severity badges and acknowledgment features
5. ✅ Monitor for any issues

---

## Need Help?

If you encounter any issues:
1. Check the PostgreSQL logs for detailed error messages
2. Run the verification queries above
3. Share the specific error message for troubleshooting
