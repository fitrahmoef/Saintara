-- Migration: Add security constraints and performance indexes
-- Description: Add check constraints for data integrity and indexes for performance
-- Date: 2025-11-06

-- ============================================================================
-- CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Add check constraints for monetary fields (prevent negative values)
ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

ALTER TABLE vouchers
  ADD CONSTRAINT vouchers_discount_valid CHECK (
    (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100))
    AND (discount_amount IS NULL OR discount_amount >= 0)
  );

-- Add check constraints for test scores
ALTER TABLE results
  ADD CONSTRAINT results_score_valid CHECK (score >= 0 AND score <= 100);

-- Add check constraints for events
ALTER TABLE events
  ADD CONSTRAINT events_capacity_positive CHECK (max_participants > 0),
  ADD CONSTRAINT events_dates_valid CHECK (end_date >= start_date),
  ADD CONSTRAINT events_price_positive CHECK (price >= 0);

-- Add check constraints for products
ALTER TABLE products
  ADD CONSTRAINT products_price_positive CHECK (price > 0),
  ADD CONSTRAINT products_stock_nonnegative CHECK (stock_quantity >= 0);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for users table (authentication and lookup)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id) WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Indexes for transactions table (financial queries)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_code ON transactions(transaction_code);

-- Indexes for articles table (content search)
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
-- Full-text search indexes for title and content
CREATE INDEX IF NOT EXISTS idx_articles_title_search ON articles USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_articles_content_search ON articles USING gin(to_tsvector('english', content));

-- Indexes for vouchers table
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON vouchers(is_used);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON vouchers(expires_at);

-- Indexes for tests table
CREATE INDEX IF NOT EXISTS idx_tests_type ON tests(type);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);

-- Indexes for results table
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON results(test_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_user_test ON results(user_id, test_id);

-- Indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Indexes for institutions table
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON institutions(created_at DESC);

-- Indexes for customers table (institution-specific)
CREATE INDEX IF NOT EXISTS idx_customers_institution_id ON customers(institution_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Indexes for agents table
CREATE INDEX IF NOT EXISTS idx_agents_institution_id ON agents(institution_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Indexes for approvals table
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity_type_id ON approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at DESC);

-- Indexes for password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT transactions_amount_positive ON transactions IS
  'Ensures transaction amounts are always positive';

COMMENT ON CONSTRAINT products_price_positive ON products IS
  'Ensures product prices are always positive';

COMMENT ON INDEX idx_users_email IS
  'Improves performance for login and user lookup by email';

COMMENT ON INDEX idx_transactions_user_id IS
  'Improves performance for user transaction history queries';

COMMENT ON INDEX idx_articles_title_search IS
  'Full-text search index for article titles';

-- ============================================================================
-- ANALYSIS AND STATISTICS UPDATE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE users;
ANALYZE transactions;
ANALYZE articles;
ANALYZE vouchers;
ANALYZE tests;
ANALYZE results;
ANALYZE events;
ANALYZE institutions;
ANALYZE customers;
ANALYZE agents;
ANALYZE products;
ANALYZE approvals;
