-- Migration: Add Payment Gateway Integration Fields
-- Description: Adds payment gateway fields to transactions table to support Stripe and Xendit

-- Add payment gateway fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50), -- stripe, xendit, manual
ADD COLUMN IF NOT EXISTS payment_gateway_id VARCHAR(255), -- Payment ID from gateway
ADD COLUMN IF NOT EXISTS payment_url TEXT, -- Payment URL for user
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP, -- Payment expiration time
ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT, -- Reason for payment failure
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255), -- Refund ID from gateway
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2), -- Amount refunded
ADD COLUMN IF NOT EXISTS refund_reason TEXT, -- Reason for refund
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP; -- When refund was processed

-- Update status enum to include more payment states
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_status_check
CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'expired'));

-- Create indexes for payment gateway lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway ON transactions(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway_id ON transactions(payment_gateway_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_expires_at ON transactions(payment_expires_at);

-- Add composite index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_lookup ON transactions(payment_gateway, payment_gateway_id);

-- Add comment for documentation
COMMENT ON COLUMN transactions.payment_gateway IS 'Payment gateway provider: stripe, xendit, or manual';
COMMENT ON COLUMN transactions.payment_gateway_id IS 'Unique payment ID from the payment gateway';
COMMENT ON COLUMN transactions.payment_url IS 'URL where user can complete payment';
COMMENT ON COLUMN transactions.payment_expires_at IS 'Timestamp when payment link expires';
COMMENT ON COLUMN transactions.refund_id IS 'Unique refund ID from the payment gateway';

-- Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- payment_created, payment_completed, payment_failed, refund_requested, etc.
    provider VARCHAR(50), -- stripe, xendit, manual
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    metadata JSONB, -- Store additional event data
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for payment logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Add payment gateway permissions
INSERT INTO permissions (name, description, resource, action, scope)
VALUES
    ('payment.gateway.create', 'Create Payment Gateway Transaction', 'payment', 'create', 'Create payment via gateway'),
    ('payment.gateway.refund', 'Refund Payment Gateway Transaction', 'payment', 'refund', 'Process refunds via gateway'),
    ('payment.webhook.receive', 'Receive Payment Webhooks', 'payment', 'webhook', 'Receive webhook notifications')
ON CONFLICT (name) DO NOTHING;

-- Grant payment gateway permissions to appropriate roles
-- Note: This assumes role_permissions table exists from previous migrations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('payment.gateway.create', 'payment.gateway.refund', 'payment.webhook.receive')
ON CONFLICT DO NOTHING;

-- Insert user permissions for payment creation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND p.name = 'payment.gateway.create'
ON CONFLICT DO NOTHING;
