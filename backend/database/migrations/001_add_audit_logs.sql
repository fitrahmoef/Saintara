-- Migration: Add audit_logs table for security tracking
-- Purpose: Track all admin actions, user changes, and security events
-- Created: 2025-01-15

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,

  -- Who performed the action
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- What action was performed
  action VARCHAR(100) NOT NULL,  -- e.g., 'user.create', 'user.update', 'approval.approve'
  resource_type VARCHAR(50) NOT NULL,  -- e.g., 'user', 'transaction', 'approval'
  resource_id VARCHAR(255),  -- ID of affected resource

  -- Details of the change
  description TEXT,
  changes JSONB,  -- Store before/after data
  metadata JSONB,  -- Additional context (IP, user agent, etc.)

  -- Request details
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),  -- GET, POST, PUT, DELETE
  request_path VARCHAR(500),

  -- Result
  status VARCHAR(20) NOT NULL DEFAULT 'success',  -- success, failure, error
  error_message TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Create index for searching by date range
CREATE INDEX idx_audit_logs_date_range ON audit_logs(created_at, user_id, resource_type);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Security audit trail for tracking all admin actions and user changes';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., user.create, transaction.approve)';
COMMENT ON COLUMN audit_logs.changes IS 'JSONB object containing before/after state';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context like device info, location, etc.';
