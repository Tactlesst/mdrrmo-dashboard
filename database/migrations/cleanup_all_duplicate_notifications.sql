-- Quick Cleanup: Remove ALL Duplicate Alert Notifications
-- This removes duplicate notifications created by the old code
-- Keeps only ONE notification per alert_id

BEGIN;

-- Show current state
SELECT 
    alert_id,
    COUNT(*) as notification_count,
    STRING_AGG(DISTINCT account_id::text, ', ') as admin_ids
FROM alert_notifications
GROUP BY alert_id
ORDER BY notification_count DESC
LIMIT 10;

RAISE NOTICE '=== BEFORE CLEANUP ===';

-- Count total notifications
DO $$
DECLARE
    total_count INTEGER;
    duplicate_alerts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM alert_notifications;
    
    SELECT COUNT(*) INTO duplicate_alerts 
    FROM (
        SELECT alert_id 
        FROM alert_notifications 
        GROUP BY alert_id 
        HAVING COUNT(*) > 1
    ) sub;
    
    RAISE NOTICE 'Total notifications: %', total_count;
    RAISE NOTICE 'Alerts with duplicates: %', duplicate_alerts;
END $$;

-- DELETE all duplicate notifications, keep only the oldest one per alert
DELETE FROM alert_notifications
WHERE id NOT IN (
    -- Keep only the notification with the smallest ID (oldest) for each alert
    SELECT MIN(id)
    FROM alert_notifications
    GROUP BY alert_id
);

-- Update all remaining notifications to have "All Admins" as recipient
UPDATE alert_notifications
SET recipient_name = 'All Admins'
WHERE recipient_name != 'All Admins' AND account_type = 'admin';

UPDATE alert_notifications
SET recipient_name = 'All Responders'
WHERE recipient_name != 'All Responders' AND account_type = 'responder';

RAISE NOTICE '=== AFTER CLEANUP ===';

-- Verify cleanup
DO $$
DECLARE
    remaining_count INTEGER;
    unique_alerts INTEGER;
    duplicates_remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM alert_notifications;
    SELECT COUNT(DISTINCT alert_id) INTO unique_alerts FROM alert_notifications;
    
    SELECT COUNT(*) INTO duplicates_remaining 
    FROM (
        SELECT alert_id 
        FROM alert_notifications 
        GROUP BY alert_id 
        HAVING COUNT(*) > 1
    ) sub;
    
    RAISE NOTICE 'Remaining notifications: %', remaining_count;
    RAISE NOTICE 'Unique alerts: %', unique_alerts;
    RAISE NOTICE 'Duplicates remaining: %', duplicates_remaining;
    
    IF duplicates_remaining = 0 THEN
        RAISE NOTICE '✅ SUCCESS! No duplicates remaining.';
    ELSE
        RAISE WARNING '⚠ Still has % alerts with duplicates!', duplicates_remaining;
    END IF;
END $$;

-- Show final state
SELECT 
    alert_id,
    COUNT(*) as notification_count,
    recipient_name
FROM alert_notifications
GROUP BY alert_id, recipient_name
ORDER BY notification_count DESC
LIMIT 10;

COMMIT;

-- Final verification query
SELECT 
    COUNT(*) as total_notifications,
    COUNT(DISTINCT alert_id) as unique_alerts,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT alert_id) THEN '✅ Perfect! 1 notification per alert'
        ELSE '❌ Still has duplicates!'
    END as status
FROM alert_notifications;
