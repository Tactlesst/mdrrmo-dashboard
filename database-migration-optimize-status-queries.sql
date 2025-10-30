-- Performance optimization for admin/responder status queries
-- This migration adds missing indexes to speed up the /api/admins/status endpoint

-- Admin sessions indexes (CRITICAL for status queries)
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_active ON admin_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email_active ON admin_sessions(admin_email, last_active_at DESC) WHERE is_active = TRUE;

-- Composite index for the cleanup query (lines 7-12 in status.js)
CREATE INDEX IF NOT EXISTS idx_admin_sessions_cleanup ON admin_sessions(last_active_at, is_active) WHERE is_active = TRUE;

-- Responder sessions indexes (CRITICAL for status queries)
CREATE INDEX IF NOT EXISTS idx_responder_sessions_responder_id_location ON responder_sessions(responder_id, location_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_responder_sessions_location_updated ON responder_sessions(location_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_responder_sessions_ended_at ON responder_sessions(ended_at) WHERE ended_at IS NULL;

-- Composite index for the cleanup query (lines 15-21 in status.js)
CREATE INDEX IF NOT EXISTS idx_responder_sessions_cleanup ON responder_sessions(location_updated_at, ended_at) WHERE ended_at IS NULL;

-- Update table statistics for query planner
ANALYZE admin_sessions;
ANALYZE responder_sessions;
ANALYZE admins;
ANALYZE responders;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('admin_sessions', 'responder_sessions')
ORDER BY tablename, indexname;
