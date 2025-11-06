-- Migration: Add Two-Factor Authentication (TOTP) Support
-- Created: 2025-11-06

-- Add 2FA columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMP;

-- Add backup codes table for account recovery
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, code_hash)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON user_backup_codes(used);

-- Add audit log for 2FA events
CREATE TABLE IF NOT EXISTS two_factor_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'enabled', 'disabled', 'verified', 'backup_code_used', 'failed_attempt'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_2fa_audit_user_id ON two_factor_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_audit_created_at ON two_factor_audit_log(created_at DESC);

-- Comments
COMMENT ON COLUMN users.two_factor_enabled IS 'Indicates if 2FA is enabled for the user';
COMMENT ON COLUMN users.two_factor_secret IS 'Encrypted TOTP secret key';
COMMENT ON COLUMN users.two_factor_verified_at IS 'Timestamp when 2FA was last verified';
COMMENT ON TABLE user_backup_codes IS 'Backup codes for 2FA account recovery';
COMMENT ON TABLE two_factor_audit_log IS 'Audit log for 2FA related events';
