-- Migration: Add updated_at column to responders table
-- Run this SQL against your PostgreSQL database

-- Add updated_at column to responders table
ALTER TABLE responders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have the current timestamp
UPDATE responders 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'responders' AND column_name = 'updated_at';
