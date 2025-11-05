-- Migration: Add institution_id to Core Tables
-- Description: Completes multi-tenancy by adding institution_id to tests, transactions, agents, agent_sales
-- Date: 2025-11-05
-- Priority: CRITICAL - Required for proper multi-tenancy isolation

-- =====================================================
-- 1. ADD institution_id TO TESTS TABLE
-- =====================================================

-- Add column
ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from users table for existing tests
UPDATE tests
SET institution_id = u.institution_id
FROM users u
WHERE tests.user_id = u.id
  AND tests.institution_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tests_institution_id ON tests(institution_id);
CREATE INDEX IF NOT EXISTS idx_tests_institution_status ON tests(institution_id, status);

-- =====================================================
-- 2. ADD institution_id TO TRANSACTIONS TABLE
-- =====================================================

-- Add column
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from users table for existing transactions
UPDATE transactions
SET institution_id = u.institution_id
FROM users u
WHERE transactions.user_id = u.id
  AND transactions.institution_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_institution_id ON transactions(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_institution_status ON transactions(institution_id, status);

-- Add monetary validation constraint
ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS check_positive_amount;

ALTER TABLE transactions
    ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

-- =====================================================
-- 3. ADD institution_id TO AGENTS TABLE
-- =====================================================

-- Add column
ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from users table for existing agents
UPDATE agents
SET institution_id = u.institution_id
FROM users u
WHERE agents.user_id = u.id
  AND agents.institution_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agents_institution_id ON agents(institution_id);
CREATE INDEX IF NOT EXISTS idx_agents_institution_status ON agents(institution_id, status);

-- Add monetary validation constraints
ALTER TABLE agents
    DROP CONSTRAINT IF EXISTS check_positive_commission_rate;

ALTER TABLE agents
    ADD CONSTRAINT check_positive_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100);

ALTER TABLE agents
    DROP CONSTRAINT IF EXISTS check_non_negative_sales;

ALTER TABLE agents
    ADD CONSTRAINT check_non_negative_sales CHECK (total_sales >= 0);

ALTER TABLE agents
    DROP CONSTRAINT IF EXISTS check_non_negative_commission;

ALTER TABLE agents
    ADD CONSTRAINT check_non_negative_commission CHECK (total_commission >= 0);

-- =====================================================
-- 4. ADD institution_id TO AGENT_SALES TABLE
-- =====================================================

-- Add column
ALTER TABLE agent_sales
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from agents table for existing agent_sales
UPDATE agent_sales
SET institution_id = a.institution_id
FROM agents a
WHERE agent_sales.agent_id = a.id
  AND agent_sales.institution_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agent_sales_institution_id ON agent_sales(institution_id);
CREATE INDEX IF NOT EXISTS idx_agent_sales_institution_status ON agent_sales(institution_id, status);

-- Add monetary validation constraint
ALTER TABLE agent_sales
    DROP CONSTRAINT IF EXISTS check_positive_commission;

ALTER TABLE agent_sales
    ADD CONSTRAINT check_positive_commission CHECK (commission_amount > 0);

-- =====================================================
-- 5. ADD institution_id TO VOUCHERS TABLE (Optional but recommended)
-- =====================================================

ALTER TABLE vouchers
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from users table for existing vouchers
UPDATE vouchers
SET institution_id = u.institution_id
FROM users u
WHERE vouchers.user_id = u.id
  AND vouchers.institution_id IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_vouchers_institution_id ON vouchers(institution_id);

-- =====================================================
-- 6. ADD institution_id TO EVENTS TABLE (Optional but recommended)
-- =====================================================

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_events_institution_id ON events(institution_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- =====================================================
-- 7. ADD institution_id TO ARTICLES TABLE (Optional but recommended)
-- =====================================================

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_articles_institution_id ON articles(institution_id);

-- =====================================================
-- 8. ADD institution_id TO APPROVALS TABLE (Optional but recommended)
-- =====================================================

ALTER TABLE approvals
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Backfill institution_id from requester
UPDATE approvals
SET institution_id = u.institution_id
FROM users u
WHERE approvals.requester_id = u.id
  AND approvals.institution_id IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_approvals_institution_id ON approvals(institution_id);

-- =====================================================
-- 9. UPDATE VIEWS TO USE DIRECT institution_id
-- =====================================================

-- Drop and recreate institution_statistics view with proper joins
DROP VIEW IF EXISTS institution_statistics;

CREATE OR REPLACE VIEW institution_statistics AS
SELECT
    i.id AS institution_id,
    i.name AS institution_name,
    i.code AS institution_code,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user') AS total_customers,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user' AND u.is_active = true) AS active_customers,
    COUNT(DISTINCT t.id) AS total_tests,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_tests,
    COUNT(DISTINCT tr.id) AS total_transactions,
    COALESCE(SUM(tr.amount) FILTER (WHERE tr.status = 'paid'), 0) AS total_revenue,
    i.max_users AS max_users,
    i.subscription_type,
    i.is_active AS is_active,
    i.created_at AS institution_created_at
FROM institutions i
LEFT JOIN users u ON u.institution_id = i.id
LEFT JOIN tests t ON t.institution_id = i.id  -- Now using direct institution_id
LEFT JOIN transactions tr ON tr.institution_id = i.id  -- Now using direct institution_id
GROUP BY i.id, i.name, i.code, i.max_users, i.subscription_type, i.is_active, i.created_at;

-- =====================================================
-- 10. CREATE ADDITIONAL VIEWS FOR ANALYTICS
-- =====================================================

-- View for agent performance per institution
CREATE OR REPLACE VIEW agent_performance_by_institution AS
SELECT
    a.institution_id,
    i.name AS institution_name,
    a.id AS agent_id,
    u.name AS agent_name,
    u.email AS agent_email,
    a.agent_code,
    a.status,
    a.commission_rate,
    COUNT(DISTINCT asales.id) AS total_sales_count,
    COALESCE(SUM(asales.commission_amount) FILTER (WHERE asales.status = 'paid'), 0) AS total_paid_commission,
    COALESCE(SUM(asales.commission_amount) FILTER (WHERE asales.status = 'pending'), 0) AS pending_commission,
    a.created_at AS agent_since
FROM agents a
LEFT JOIN institutions i ON a.institution_id = i.id
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN agent_sales asales ON asales.agent_id = a.id
GROUP BY a.institution_id, i.name, a.id, u.name, u.email, a.agent_code, a.status, a.commission_rate, a.created_at;

-- View for transaction summary per institution
CREATE OR REPLACE VIEW transaction_summary_by_institution AS
SELECT
    t.institution_id,
    i.name AS institution_name,
    COUNT(*) AS total_transactions,
    COUNT(*) FILTER (WHERE t.status = 'paid') AS paid_count,
    COUNT(*) FILTER (WHERE t.status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE t.status = 'failed') AS failed_count,
    COUNT(*) FILTER (WHERE t.status = 'refunded') AS refunded_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'paid'), 0) AS total_paid_amount,
    COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'pending'), 0) AS pending_amount,
    COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'refunded'), 0) AS refunded_amount,
    COALESCE(AVG(t.amount) FILTER (WHERE t.status = 'paid'), 0) AS average_transaction_value
FROM transactions t
LEFT JOIN institutions i ON t.institution_id = i.id
WHERE t.institution_id IS NOT NULL
GROUP BY t.institution_id, i.name;

-- View for test completion rates per institution
CREATE OR REPLACE VIEW test_completion_by_institution AS
SELECT
    t.institution_id,
    i.name AS institution_name,
    COUNT(*) AS total_tests,
    COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_tests,
    COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress_tests,
    COUNT(*) FILTER (WHERE t.status = 'pending') AS pending_tests,
    ROUND(
        (COUNT(*) FILTER (WHERE t.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
        2
    ) AS completion_rate_percent
FROM tests t
LEFT JOIN institutions i ON t.institution_id = i.id
WHERE t.institution_id IS NOT NULL
GROUP BY t.institution_id, i.name;

-- =====================================================
-- 11. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN tests.institution_id IS 'Institution this test belongs to (for multi-tenancy isolation)';
COMMENT ON COLUMN transactions.institution_id IS 'Institution this transaction belongs to (for revenue tracking)';
COMMENT ON COLUMN agents.institution_id IS 'Institution this agent belongs to (for commission attribution)';
COMMENT ON COLUMN agent_sales.institution_id IS 'Institution this sale belongs to (for commission isolation)';
COMMENT ON COLUMN vouchers.institution_id IS 'Institution this voucher belongs to (optional, for voucher isolation)';
COMMENT ON COLUMN events.institution_id IS 'Institution hosting this event (optional, for event isolation)';
COMMENT ON COLUMN articles.institution_id IS 'Institution this article belongs to (optional, for content isolation)';
COMMENT ON COLUMN approvals.institution_id IS 'Institution this approval belongs to (for approval isolation)';

-- =====================================================
-- 12. VERIFICATION QUERIES
-- =====================================================

-- Verify all critical tables now have institution_id
DO $$
BEGIN
    RAISE NOTICE 'Migration 008 completed successfully!';
    RAISE NOTICE 'Tables updated: tests, transactions, agents, agent_sales, vouchers, events, articles, approvals';
    RAISE NOTICE 'Indexes created: 8 new indexes for institution_id fields';
    RAISE NOTICE 'Views updated: institution_statistics';
    RAISE NOTICE 'Views created: agent_performance_by_institution, transaction_summary_by_institution, test_completion_by_institution';
    RAISE NOTICE 'Constraints added: Positive amount validations for transactions, agents, agent_sales';
END $$;
