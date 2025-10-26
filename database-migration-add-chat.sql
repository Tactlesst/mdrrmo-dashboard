-- Migration: Add 'chat' to notifications sender_type constraint
-- Run this SQL against your PostgreSQL database

-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_sender_type_check;

-- Add the new constraint with 'chat' included
ALTER TABLE notifications ADD CONSTRAINT notifications_sender_type_check 
  CHECK (sender_type IN ('admin', 'responder', 'system', 'chat'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notifications_sender_type_check';
