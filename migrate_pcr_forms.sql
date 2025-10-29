-- Migration Script for PCR Forms Table
-- This script adds alert_id column and foreign key constraints to existing pcr_forms table

-- Step 1: Add alert_id column to pcr_forms table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pcr_forms' AND column_name = 'alert_id'
    ) THEN
        ALTER TABLE public.pcr_forms ADD COLUMN alert_id uuid;
        RAISE NOTICE 'Column alert_id added to pcr_forms table';
    ELSE
        RAISE NOTICE 'Column alert_id already exists in pcr_forms table';
    END IF;
END $$;

-- Step 2: Migrate existing alertId from JSONB to the new column
-- This extracts the alertId from the full_form JSONB and populates the new alert_id column
UPDATE public.pcr_forms 
SET alert_id = (full_form->>'alertId')::uuid
WHERE full_form->>'alertId' IS NOT NULL 
  AND full_form->>'alertId' != '';

-- Step 3: Add foreign key constraint for alert_id (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pcr_forms_alert_id_fkey'
    ) THEN
        ALTER TABLE public.pcr_forms
        ADD CONSTRAINT pcr_forms_alert_id_fkey 
        FOREIGN KEY (alert_id) 
        REFERENCES public.alerts(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key constraint pcr_forms_alert_id_fkey added';
    ELSE
        RAISE NOTICE 'Foreign key constraint pcr_forms_alert_id_fkey already exists';
    END IF;
END $$;

-- Step 4: Add foreign key constraints for created_by_id (admin and responder)
-- Note: These use DEFERRABLE INITIALLY DEFERRED to handle polymorphic relationships
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pcr_forms_created_by_admin_fkey'
    ) THEN
        ALTER TABLE public.pcr_forms
        ADD CONSTRAINT pcr_forms_created_by_admin_fkey 
        FOREIGN KEY (created_by_id) 
        REFERENCES public.admins(id) 
        ON DELETE CASCADE 
        DEFERRABLE INITIALLY DEFERRED;
        RAISE NOTICE 'Foreign key constraint pcr_forms_created_by_admin_fkey added';
    ELSE
        RAISE NOTICE 'Foreign key constraint pcr_forms_created_by_admin_fkey already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pcr_forms_created_by_responder_fkey'
    ) THEN
        ALTER TABLE public.pcr_forms
        ADD CONSTRAINT pcr_forms_created_by_responder_fkey 
        FOREIGN KEY (created_by_id) 
        REFERENCES public.responders(id) 
        ON DELETE CASCADE 
        DEFERRABLE INITIALLY DEFERRED;
        RAISE NOTICE 'Foreign key constraint pcr_forms_created_by_responder_fkey added';
    ELSE
        RAISE NOTICE 'Foreign key constraint pcr_forms_created_by_responder_fkey already exists';
    END IF;
END $$;

-- Step 5: Create indexes for better query performance (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pcr_forms_alert_id'
    ) THEN
        CREATE INDEX idx_pcr_forms_alert_id 
        ON public.pcr_forms USING btree (alert_id);
        RAISE NOTICE 'Index idx_pcr_forms_alert_id created';
    ELSE
        RAISE NOTICE 'Index idx_pcr_forms_alert_id already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pcr_forms_created_by'
    ) THEN
        CREATE INDEX idx_pcr_forms_created_by 
        ON public.pcr_forms USING btree (created_by_type, created_by_id);
        RAISE NOTICE 'Index idx_pcr_forms_created_by created';
    ELSE
        RAISE NOTICE 'Index idx_pcr_forms_created_by already exists';
    END IF;
END $$;

-- Step 6: Verify the migration
-- Check how many PCR forms have alert_id populated
SELECT 
    COUNT(*) as total_pcr_forms,
    COUNT(alert_id) as pcr_forms_with_alert,
    COUNT(*) - COUNT(alert_id) as pcr_forms_without_alert
FROM public.pcr_forms;

-- Step 7: View sample data to verify
SELECT 
    id,
    patient_name,
    alert_id,
    created_by_type,
    created_by_id,
    created_at
FROM public.pcr_forms
ORDER BY created_at DESC
LIMIT 10;
