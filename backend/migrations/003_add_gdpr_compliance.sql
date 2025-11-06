-- Migration: GDPR Compliance Tables
-- Created: 2025-01-06

-- Add GDPR-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_processing_restricted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Table: consent_history
-- Stores user consent records for GDPR compliance
CREATE TABLE IF NOT EXISTS consent_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add anonymization fields to test_results
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;

-- Add anonymization fields to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;

-- Indexes for GDPR operations
CREATE INDEX IF NOT EXISTS idx_users_scheduled_deletion ON users(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_history_user_id ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_type ON consent_history(consent_type);

-- Comments
COMMENT ON COLUMN users.deletion_requested_at IS 'Timestamp when user requested account deletion';
COMMENT ON COLUMN users.scheduled_deletion_at IS 'Timestamp when account will be permanently deleted';
COMMENT ON COLUMN users.data_processing_restricted IS 'Whether data processing is restricted per GDPR Article 18';
COMMENT ON TABLE consent_history IS 'Records user consent for data processing and marketing';
