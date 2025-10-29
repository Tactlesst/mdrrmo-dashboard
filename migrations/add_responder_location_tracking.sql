-- Migration: Add location tracking to responder_sessions
-- This enables real-time tracking of responder locations and routes

-- Add location tracking columns to responder_sessions
ALTER TABLE responder_sessions 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS speed DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS assigned_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS destination_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS destination_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS route_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_responder_sessions_location 
ON responder_sessions(current_latitude, current_longitude) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_responder_sessions_alert 
ON responder_sessions(assigned_alert_id) 
WHERE assigned_alert_id IS NOT NULL;

-- Create table for location history (breadcrumb trail)
CREATE TABLE IF NOT EXISTS responder_location_history (
    id SERIAL PRIMARY KEY,
    responder_id INTEGER REFERENCES responders(id) ON DELETE CASCADE,
    session_id UUID REFERENCES responder_sessions(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    accuracy DECIMAL(8, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL
);

-- Create index for location history queries
CREATE INDEX IF NOT EXISTS idx_location_history_responder 
ON responder_location_history(responder_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_session 
ON responder_location_history(session_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_alert 
ON responder_location_history(alert_id, recorded_at DESC);

-- Add comment for documentation
COMMENT ON TABLE responder_location_history IS 'Stores historical location data for responders to show routes and movement patterns';
COMMENT ON COLUMN responder_sessions.current_latitude IS 'Current latitude of responder';
COMMENT ON COLUMN responder_sessions.current_longitude IS 'Current longitude of responder';
COMMENT ON COLUMN responder_sessions.heading IS 'Direction of movement in degrees (0-360)';
COMMENT ON COLUMN responder_sessions.speed IS 'Speed in meters per second';
COMMENT ON COLUMN responder_sessions.assigned_alert_id IS 'Alert/incident the responder is currently responding to';
