-- Migration: Add refresh tokens table for secure authentication
-- This table stores refresh tokens for cookie-based authentication with automatic cleanup

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Add comment
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for secure cookie-based authentication';
COMMENT ON COLUMN refresh_tokens.token IS 'UUID-based refresh token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp (typically 7 days)';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Whether token has been revoked (logout, security)';

-- Create function to clean up expired tokens (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO saintara_app;
-- GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO saintara_app;
