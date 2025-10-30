-- Fix admin_sessions table for proper heartbeat UPSERT functionality
-- This migration adds a unique constraint on admin_email and cleans up duplicate sessions

-- Step 1: Clean up duplicate sessions (keep only the most recent one per email)
DELETE FROM admin_sessions a
USING admin_sessions b
WHERE a.id < b.id 
  AND a.admin_email = b.admin_email;

-- Alternative cleanup if above doesn't work (keeps the most recent session):
-- WITH ranked_sessions AS (
--   SELECT id, 
--          ROW_NUMBER() OVER (PARTITION BY admin_email ORDER BY last_active_at DESC) as rn
--   FROM admin_sessions
-- )
-- DELETE FROM admin_sessions
-- WHERE id IN (
--   SELECT id FROM ranked_sessions WHERE rn > 1
-- );

-- Step 2: Add unique constraint on admin_email
ALTER TABLE admin_sessions 
ADD CONSTRAINT admin_sessions_admin_email_key 
UNIQUE (admin_email);

-- Step 3: Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'admin_sessions'::regclass
  AND contype = 'u';

-- Step 4: Show current sessions (should be one per email now)
SELECT 
    admin_email,
    COUNT(*) as session_count,
    MAX(last_active_at) as most_recent_activity,
    BOOL_OR(is_active) as any_active
FROM admin_sessions
GROUP BY admin_email
ORDER BY most_recent_activity DESC;

-- Expected output: Each admin_email should have session_count = 1
