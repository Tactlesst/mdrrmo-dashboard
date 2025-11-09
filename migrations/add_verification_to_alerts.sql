-- Add verification fields to alerts table
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES public.admins(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN public.alerts.is_verified IS 'Indicates if the incident has been verified by an admin before sending to responders';
COMMENT ON COLUMN public.alerts.verified_by IS 'Admin ID who verified the incident';
COMMENT ON COLUMN public.alerts.verified_at IS 'Timestamp when the incident was verified';
COMMENT ON COLUMN public.alerts.verification_notes IS 'Notes added by admin during verification';

-- Create index for faster queries on verified status
CREATE INDEX IF NOT EXISTS idx_alerts_is_verified ON public.alerts(is_verified);
CREATE INDEX IF NOT EXISTS idx_alerts_verified_at ON public.alerts(verified_at);
