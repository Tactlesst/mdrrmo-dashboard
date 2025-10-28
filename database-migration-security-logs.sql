-- Create security_logs table for tracking security events

CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_logs(email);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);

-- Add comments for documentation
COMMENT ON TABLE security_logs IS 'Logs security-related events like failed logins, rate limiting, etc.';
COMMENT ON COLUMN security_logs.event_type IS 'Type of security event: failed_login, successful_login, rate_limit_exceeded, suspicious_activity';
COMMENT ON COLUMN security_logs.severity IS 'Severity level: low, medium, high, critical';
