-- Migration: Add read column to notifications table
-- Run this SQL against your PostgreSQL database

-- Add read column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Update existing rows to have read = false
UPDATE notifications 
SET read = FALSE 
WHERE read IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'read';

-- Optional: Create an index on read column for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Show sample data
SELECT id, account_type, sender_name, message, read, created_at 
FROM notifications 
LIMIT 5;
