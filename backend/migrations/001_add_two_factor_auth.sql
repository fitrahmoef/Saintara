-- Migration: Add Two-Factor Authentication Tables
-- Created: 2025-01-06

-- Table: two_factor_auth
-- Stores 2FA secrets and backup codes for users
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT NOT NULL, -- JSON array of backup codes
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: two_factor_recovery
-- Stores recovery tokens for 2FA reset
CREATE TABLE IF NOT EXISTS two_factor_recovery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX idx_two_factor_recovery_token ON two_factor_recovery(token);
CREATE INDEX idx_two_factor_recovery_user_id ON two_factor_recovery(user_id);

-- Comments
COMMENT ON TABLE two_factor_auth IS 'Stores two-factor authentication configuration for users';
COMMENT ON TABLE two_factor_recovery IS 'Stores recovery tokens for 2FA reset via email';
COMMENT ON COLUMN two_factor_auth.secret IS 'TOTP secret key (base32 encoded)';
COMMENT ON COLUMN two_factor_auth.backup_codes IS 'JSON array of backup codes for account recovery';
COMMENT ON COLUMN two_factor_recovery.token IS 'One-time recovery token sent via email';
