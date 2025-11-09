-- Add CHECK constraints to alerts table to ensure valid geographic coordinates
-- This prevents invalid lat/lng values from being inserted into the database

-- Drop existing constraints if they exist (in case of re-running)
ALTER TABLE public.alerts 
DROP CONSTRAINT IF EXISTS alerts_lat_check;

ALTER TABLE public.alerts 
DROP CONSTRAINT IF EXISTS alerts_lng_check;

-- Add CHECK constraint for latitude (must be between -90 and 90)
ALTER TABLE public.alerts 
ADD CONSTRAINT alerts_lat_check 
CHECK (lat >= -90 AND lat <= 90);

-- Add CHECK constraint for longitude (must be between -180 and 180)
ALTER TABLE public.alerts 
ADD CONSTRAINT alerts_lng_check 
CHECK (lng >= -180 AND lng <= 180);

-- Add comments to document the constraints
COMMENT ON CONSTRAINT alerts_lat_check ON public.alerts IS 
'Ensures latitude is within valid geographic range (-90 to 90 degrees)';

COMMENT ON CONSTRAINT alerts_lng_check ON public.alerts IS 
'Ensures longitude is within valid geographic range (-180 to 180 degrees)';

-- Verify the constraints were added successfully
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.alerts'::regclass
AND conname IN ('alerts_lat_check', 'alerts_lng_check');
