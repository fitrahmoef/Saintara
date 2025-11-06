-- Migration: Add OAuth Accounts Table
-- Created: 2025-01-06

-- Table: oauth_accounts
-- Stores OAuth provider accounts linked to users
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one OAuth account per user per provider
  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id);

-- Modify users table to allow NULL password (for OAuth-only users)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add email_verified column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add avatar_url column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comments
COMMENT ON TABLE oauth_accounts IS 'Stores OAuth provider accounts (Google, GitHub) linked to users';
COMMENT ON COLUMN oauth_accounts.provider IS 'OAuth provider name (google, github)';
COMMENT ON COLUMN oauth_accounts.provider_user_id IS 'User ID from OAuth provider';
