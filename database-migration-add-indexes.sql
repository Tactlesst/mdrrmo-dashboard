-- Performance optimization: Add indexes for faster dashboard queries
-- Run this migration to speed up data loading

-- Alerts table indexes
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_occurred_at ON alerts(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_responder_id ON alerts(responder_id);
CREATE INDEX IF NOT EXISTS idx_alerts_lat_lng ON alerts(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Responders table indexes
CREATE INDEX IF NOT EXISTS idx_responders_created_at ON responders(created_at DESC);

-- Responder sessions indexes
CREATE INDEX IF NOT EXISTS idx_responder_sessions_active ON responder_sessions(is_active, status) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_responder_sessions_responder_id ON responder_sessions(responder_id);
CREATE INDEX IF NOT EXISTS idx_responder_sessions_last_active ON responder_sessions(last_active_at DESC);

-- Admins table indexes
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at DESC);

-- Analyze tables to update statistics for query planner
ANALYZE alerts;
ANALYZE users;
ANALYZE responders;
ANALYZE responder_sessions;
ANALYZE admins;
