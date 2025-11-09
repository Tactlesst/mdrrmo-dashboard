-- Create alert_referrals table to track incident referrals to other authorities
CREATE TABLE IF NOT EXISTS alert_referrals (
  id SERIAL PRIMARY KEY,
  alert_id UUID NOT NULL,
  referred_to_authority VARCHAR(100) NOT NULL,
  referred_by VARCHAR(100),
  referral_notes TEXT,
  referred_at TIMESTAMP NOT NULL,
  alert_type VARCHAR(100),
  alert_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

-- Create indexes for alert_referrals
CREATE INDEX IF NOT EXISTS idx_alert_referrals_alert_id ON alert_referrals(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_referrals_authority ON alert_referrals(referred_to_authority);
CREATE INDEX IF NOT EXISTS idx_alert_referrals_referred_at ON alert_referrals(referred_at);

-- Add referral columns to alerts table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='alerts' AND column_name='referred_to') THEN
    ALTER TABLE alerts ADD COLUMN referred_to VARCHAR(100) DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='alerts' AND column_name='referred_at') THEN
    ALTER TABLE alerts ADD COLUMN referred_at TIMESTAMP DEFAULT NULL;
  END IF;
END $$;

-- Add index for referred alerts
CREATE INDEX IF NOT EXISTS idx_alerts_referred_to ON alerts(referred_to);
