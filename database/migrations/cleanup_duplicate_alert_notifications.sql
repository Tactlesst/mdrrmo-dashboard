-- Cleanup Script: Remove Duplicate Alert Notifications
-- This script removes duplicate alert notifications created before the broadcast fix
-- It keeps only ONE notification per alert (the oldest one)

-- IMPORTANT: Run this AFTER deploying the broadcast notification fix

BEGIN;

-- Step 1: Show current duplicate notifications
DO $$
DECLARE
    duplicate_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM alert_notifications;
    
    SELECT COUNT(*) INTO duplicate_count 
    FROM (
        SELECT alert_id, COUNT(*) as count
        FROM alert_notifications
        GROUP BY alert_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Total alert notifications: %', total_count;
    RAISE NOTICE 'Alerts with duplicate notifications: %', duplicate_count;
END $$;

-- Step 2: Preview what will be deleted
SELECT 
    an.id,
    an.alert_id,
    an.account_id,
    an.recipient_name,
    an.created_at,
    an.is_read,
    'WILL BE DELETED' as action
FROM alert_notifications an
WHERE an.id NOT IN (
    -- Keep only the oldest notification for each alert
    SELECT MIN(id)
    FROM alert_notifications
    GROUP BY alert_id
)
ORDER BY an.alert_id, an.id;

-- Step 3: Delete duplicate notifications (keeps oldest one per alert)
DELETE FROM alert_notifications
WHERE id NOT IN (
    -- Keep only the oldest notification for each alert
    SELECT MIN(id)
    FROM alert_notifications
    GROUP BY alert_id
);

-- Step 4: Show results
DO $$
DECLARE
    remaining_count INTEGER;
    unique_alerts INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM alert_notifications;
    SELECT COUNT(DISTINCT alert_id) INTO unique_alerts FROM alert_notifications;
    
    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE 'Remaining notifications: %', remaining_count;
    RAISE NOTICE 'Unique alerts: %', unique_alerts;
    RAISE NOTICE 'Each alert now has exactly 1 notification';
END $$;

-- Step 5: Verify no duplicates remain
SELECT 
    alert_id,
    COUNT(*) as notification_count
FROM alert_notifications
GROUP BY alert_id
HAVING COUNT(*) > 1;
-- Should return 0 rows

COMMIT;

-- Optional: Update recipient_name to "All Admins" for consistency
UPDATE alert_notifications
SET recipient_name = 'All Admins'
WHERE recipient_name != 'All Admins';

-- Verification query: Check the results
SELECT 
    COUNT(*) as total_notifications,
    COUNT(DISTINCT alert_id) as unique_alerts,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT alert_id) THEN '✅ No duplicates'
        ELSE '❌ Still has duplicates'
    END as status
FROM alert_notifications;
