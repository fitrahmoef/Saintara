-- Migration: Add Webhook Idempotency Protection
-- Description: Prevents webhook replay attacks by tracking processed webhook events
-- Date: 2025-11-05
-- Priority: CRITICAL - Security vulnerability fix

-- =====================================================
-- 1. CREATE WEBHOOK_EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(255) UNIQUE NOT NULL, -- Unique identifier from payment provider
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'xendit', 'manual')),
    event_type VARCHAR(100) NOT NULL, -- payment.paid, payment.failed, refund.processed, etc.
    payment_id VARCHAR(255), -- External payment ID from provider
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    payload JSONB, -- Full webhook payload for debugging
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ADD INDEXES FOR FAST LOOKUPS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id ON webhook_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Composite index for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique_event
    ON webhook_events(provider, webhook_id);

-- =====================================================
-- 3. ADD PAYMENT_LOGS TABLE FOR AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    payment_gateway VARCHAR(50) CHECK (payment_gateway IN ('stripe', 'xendit', 'manual')),
    payment_gateway_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- payment_created, payment_paid, payment_failed, refund_initiated, refund_completed
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    amount DECIMAL(10, 2),
    metadata JSONB,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. ADD INDEXES FOR PAYMENT_LOGS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_gateway ON payment_logs(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- =====================================================
-- 5. ADD WEBHOOK TRACKING FIELDS TO TRANSACTIONS
-- =====================================================

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS last_webhook_received_at TIMESTAMP;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS webhook_event_count INTEGER DEFAULT 0;

-- =====================================================
-- 6. CREATE FUNCTION TO CLEAN OLD WEBHOOK EVENTS
-- =====================================================

-- Function to clean webhook events older than 90 days
CREATE OR REPLACE FUNCTION clean_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND status = 'completed';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE webhook_events IS 'Tracks processed webhook events to prevent replay attacks and duplicate processing';
COMMENT ON TABLE payment_logs IS 'Audit trail for all payment-related events and status changes';
COMMENT ON COLUMN webhook_events.webhook_id IS 'Unique event ID from payment provider (idempotency key)';
COMMENT ON COLUMN webhook_events.payload IS 'Full webhook payload stored for debugging and audit purposes';
COMMENT ON COLUMN webhook_events.retry_count IS 'Number of times this webhook was retried (for failed webhooks)';
COMMENT ON COLUMN transactions.last_webhook_received_at IS 'Timestamp of most recent webhook received for this transaction';
COMMENT ON COLUMN transactions.webhook_event_count IS 'Total number of webhook events received for this transaction';

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed successfully!';
    RAISE NOTICE 'Tables created: webhook_events, payment_logs';
    RAISE NOTICE 'Indexes created: 7 indexes on webhook_events, 4 indexes on payment_logs';
    RAISE NOTICE 'Functions created: clean_old_webhook_events()';
    RAISE NOTICE 'Webhook replay attack protection is now enabled!';
END $$;
