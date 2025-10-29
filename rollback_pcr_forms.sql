-- Rollback Script for PCR Forms Migration
-- Use this script if you need to undo the changes made by migrate_pcr_forms.sql

-- Step 1: Drop indexes
DROP INDEX IF EXISTS public.idx_pcr_forms_alert_id;
DROP INDEX IF EXISTS public.idx_pcr_forms_created_by;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.pcr_forms
DROP CONSTRAINT IF EXISTS pcr_forms_alert_id_fkey;

ALTER TABLE public.pcr_forms
DROP CONSTRAINT IF EXISTS pcr_forms_created_by_admin_fkey;

ALTER TABLE public.pcr_forms
DROP CONSTRAINT IF EXISTS pcr_forms_created_by_responder_fkey;

-- Step 3: Drop the alert_id column
ALTER TABLE public.pcr_forms
DROP COLUMN IF EXISTS alert_id;

-- Verification: Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pcr_forms'
ORDER BY ordinal_position;
