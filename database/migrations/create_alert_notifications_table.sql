-- Migration: Create separate alert_notifications table
-- This separates alert/emergency notifications from regular notifications (chat, admin, system)
-- Run this SQL against your PostgreSQL database

-- Create alert_notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id UUID NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('admin', 'responder')),
    account_id INTEGER NOT NULL,
    sender_type VARCHAR(20) DEFAULT 'alerts1',
    sender_id INTEGER,
    sender_name VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to alerts table
    CONSTRAINT fk_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    
    -- Foreign keys for account (admin or responder)
    CONSTRAINT fk_account_admin FOREIGN KEY (account_id) REFERENCES admins(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fk_account_responder FOREIGN KEY (account_id) REFERENCES responders(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    
    -- Foreign keys for sender (admin or responder)
    CONSTRAINT fk_sender_admin FOREIGN KEY (sender_id) REFERENCES admins(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fk_sender_responder FOREIGN KEY (sender_id) REFERENCES responders(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_account ON alert_notifications(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_is_read ON alert_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_is_acknowledged ON alert_notifications(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_severity ON alert_notifications(severity);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_alert_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_notifications_updated_at
    BEFORE UPDATE ON alert_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_notifications_updated_at();

-- IMPORTANT: Migrate existing alert notifications BEFORE updating constraint
-- Step 1: Find and migrate existing alert notifications to the new table

-- First, let's see what we're dealing with
DO $$
DECLARE
    alert_notif_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO alert_notif_count
    FROM notifications
    WHERE sender_type IN ('responder', 'alerts1');
    
    RAISE NOTICE 'Found % alert notifications to migrate', alert_notif_count;
END $$;

-- Step 2: Migrate existing alert notifications
-- We'll try to match them to alerts, or create a generic alert_id if we can't find a match
INSERT INTO alert_notifications (
    alert_id,
    account_type,
    account_id,
    sender_type,
    sender_id,
    sender_name,
    recipient_name,
    message,
    severity,
    is_read,
    created_at,
    updated_at
)
SELECT 
    -- Try to find matching alert, otherwise use the most recent alert
    COALESCE(
        (SELECT a.id 
         FROM alerts a 
         WHERE n.message ILIKE '%' || a.type || '%' 
            OR n.message ILIKE '%' || a.address || '%'
         ORDER BY a.created_at DESC 
         LIMIT 1),
        (SELECT id FROM alerts ORDER BY created_at DESC LIMIT 1)
    ) as alert_id,
    n.account_type,
    n.account_id,
    n.sender_type,
    n.sender_id,
    n.sender_name,
    n.recipient_name,
    n.message,
    'high' as severity, -- Default severity for migrated alerts
    n.is_read,
    n.created_at,
    n.updated_at
FROM notifications n
WHERE n.sender_type IN ('responder', 'alerts1')
    AND EXISTS (SELECT 1 FROM alerts LIMIT 1) -- Only migrate if alerts table has data
ON CONFLICT DO NOTHING;

-- Step 3: Delete migrated alert notifications from notifications table
DELETE FROM notifications WHERE sender_type IN ('responder', 'alerts1');

-- Step 4: NOW we can safely update the constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_sender_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_sender_type_check 
    CHECK (sender_type IN ('admin', 'system', 'chat'));

-- Verify migration
DO $$
DECLARE
    migrated_count INTEGER;
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM alert_notifications;
    SELECT COUNT(*) INTO remaining_count FROM notifications WHERE sender_type IN ('responder', 'alerts1');
    
    RAISE NOTICE 'Migration complete: % alert notifications in new table', migrated_count;
    RAISE NOTICE 'Remaining alert notifications in old table: %', remaining_count;
    
    IF remaining_count > 0 THEN
        RAISE WARNING 'Still have % alert notifications in old table - migration may have failed', remaining_count;
    END IF;
END $$;

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'alert_notifications'
ORDER BY ordinal_position;

-- Show count of records
SELECT 
    'alert_notifications' as table_name,
    COUNT(*) as record_count
FROM alert_notifications
UNION ALL
SELECT 
    'notifications' as table_name,
    COUNT(*) as record_count
FROM notifications;
