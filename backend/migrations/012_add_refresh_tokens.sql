-- Migration: Add refresh token support
-- Description: Implement refresh token mechanism for enhanced security
-- Date: 2025-11-06

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  replaced_by_token VARCHAR(255) NULL,
  device_info TEXT NULL,
  ip_address VARCHAR(45) NULL,
  CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at) WHERE revoked_at IS NOT NULL;

-- Add comments
COMMENT ON TABLE refresh_tokens IS
  'Stores refresh tokens for JWT token refresh mechanism';

COMMENT ON COLUMN refresh_tokens.token IS
  'Cryptographically secure refresh token';

COMMENT ON COLUMN refresh_tokens.expires_at IS
  'Expiration time for the refresh token (typically 30 days)';

COMMENT ON COLUMN refresh_tokens.revoked_at IS
  'Timestamp when token was revoked (for token rotation security)';

COMMENT ON COLUMN refresh_tokens.replaced_by_token IS
  'Reference to the new token that replaced this one (for audit trail)';

-- Update statistics
ANALYZE refresh_tokens;
