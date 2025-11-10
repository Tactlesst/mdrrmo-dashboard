-- Migration: Make account_id nullable for true broadcast notifications
-- This allows notifications to be sent to all admins/responders without being tied to a specific account

BEGIN;

-- Step 1: Drop the foreign key constraints on account_id
ALTER TABLE alert_notifications
DROP CONSTRAINT IF EXISTS fk_account_admin;

ALTER TABLE alert_notifications
DROP CONSTRAINT IF EXISTS fk_account_responder;

-- Step 2: Make account_id nullable
ALTER TABLE alert_notifications
ALTER COLUMN account_id DROP NOT NULL;

-- Step 3: Set existing account_id values to NULL for broadcast notifications
UPDATE alert_notifications
SET account_id = NULL
WHERE recipient_name IN ('All Admins', 'All Responders');

-- Step 4: Verify the changes
DO $$
DECLARE
    nullable_check TEXT;
    broadcast_count INTEGER;
BEGIN
    -- Check if account_id is now nullable
    SELECT is_nullable INTO nullable_check
    FROM information_schema.columns
    WHERE table_name = 'alert_notifications' AND column_name = 'account_id';
    
    IF nullable_check = 'YES' THEN
        RAISE NOTICE '✅ account_id is now nullable';
    ELSE
        RAISE WARNING '❌ account_id is still NOT NULL';
    END IF;
    
    -- Count broadcast notifications with NULL account_id
    SELECT COUNT(*) INTO broadcast_count
    FROM alert_notifications
    WHERE account_id IS NULL;
    
    RAISE NOTICE 'Broadcast notifications (account_id = NULL): %', broadcast_count;
END $$;

-- Step 5: Show sample data
SELECT 
    id,
    alert_id,
    account_type,
    account_id,
    recipient_name,
    message,
    created_at
FROM alert_notifications
ORDER BY created_at DESC
LIMIT 10;

COMMIT;

-- Verification query
SELECT 
    CASE 
        WHEN account_id IS NULL THEN 'Broadcast (NULL account_id)'
        ELSE 'Specific account'
    END as notification_type,
    COUNT(*) as count,
    recipient_name
FROM alert_notifications
GROUP BY 
    CASE WHEN account_id IS NULL THEN 'Broadcast (NULL account_id)' ELSE 'Specific account' END,
    recipient_name
ORDER BY count DESC;
