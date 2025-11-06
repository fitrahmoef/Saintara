-- Migration: Add Email Verification
-- Description: Adds email verification functionality to prevent fake email registrations
-- Author: Claude
-- Date: 2025-11-06

-- Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add email_verified_at timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Create email_verification_tokens table (similar to password_reset_tokens)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Add index on email_verified for filtering verified/unverified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add login_attempts and locked_until columns for account lockout
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create index for locked_until
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
