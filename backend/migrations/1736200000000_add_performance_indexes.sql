-- Migration: Add Performance Indexes
-- Purpose: Improve query performance for frequently accessed data
-- Date: 2025-01-06

-- ========== USERS TABLE ==========
-- Index for login queries (email lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for institution queries
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id) WHERE institution_id IS NOT NULL;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for email verification status
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- ========== TESTS TABLE ==========
-- Index for user's tests (most common query)
CREATE INDEX IF NOT EXISTS idx_tests_user_id_created_at ON tests(user_id, created_at DESC);

-- Index for test status queries
CREATE INDEX IF NOT EXISTS idx_tests_user_id_completed_at ON tests(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

-- Index for test type queries
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON tests(test_type);

-- ========== TEST_ANSWERS TABLE ==========
-- Index for test answers lookup (foreign key)
CREATE INDEX IF NOT EXISTS idx_test_answers_test_id ON test_answers(test_id);

-- Index for question lookups
CREATE INDEX IF NOT EXISTS idx_test_answers_question_id ON test_answers(question_id);

-- Composite index for test answer queries
CREATE INDEX IF NOT EXISTS idx_test_answers_test_question ON test_answers(test_id, question_id);

-- ========== TRANSACTIONS TABLE ==========
-- Index for user's transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created_at ON transactions(user_id, created_at DESC);

-- Index for transaction status queries
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Index for payment method analysis
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- Index for admin transaction queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at ON transactions(status, created_at DESC);

-- ========== REFRESH_TOKENS TABLE ==========
-- Index for token lookup and validation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Index for token expiration cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Index for user's active tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id_revoked ON refresh_tokens(user_id, revoked_at) WHERE revoked_at IS NULL;

-- ========== PASSWORD_RESET_TOKENS TABLE ==========
-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Index for user's reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Index for token expiration
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ========== EMAIL_VERIFICATION_TOKENS TABLE ==========
-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Index for user's verification tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Index for token expiration
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- ========== VOUCHERS TABLE ==========
-- Index for user's vouchers
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id) WHERE user_id IS NOT NULL;

-- Index for voucher code lookup
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

-- Index for unused vouchers
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used_expires_at ON vouchers(is_used, expires_at) WHERE is_used = false;

-- ========== EVENT_REGISTRATIONS TABLE ==========
-- Index for user's event registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);

-- Index for event's registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);

-- Index for registration status
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Composite index for user+event queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_event ON event_registrations(user_id, event_id);

-- ========== EVENTS TABLE ==========
-- Index for event status queries
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Index for upcoming events
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- ========== APPROVAL_REQUESTS TABLE ==========
-- Index for user's approval requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_id ON approval_requests(user_id);

-- Index for approval status
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

-- Index for approval type
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(type);

-- Index for pending approvals (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_approval_requests_status_created ON approval_requests(status, created_at DESC) WHERE status = 'pending';

-- ========== ARTICLES TABLE ==========
-- Index for published articles
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published) WHERE is_published = true;

-- Index for article category
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category) WHERE category IS NOT NULL;

-- Index for published articles by category
CREATE INDEX IF NOT EXISTS idx_articles_published_category ON articles(is_published, category, created_at DESC) WHERE is_published = true;

-- ========== INSTITUTIONS TABLE ==========
-- Index for institution code lookup
CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);

-- Index for active institutions
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON institutions(is_active) WHERE is_active = true;

-- ========== CUSTOMERS (via users table with role filter) ==========
-- Index for customer searches
CREATE INDEX IF NOT EXISTS idx_users_role_name ON users(role, name) WHERE role = 'user';

-- Index for customer tags
CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON customer_tags(customer_id) WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customer_tags');

-- ========== PERFORMANCE NOTES ==========
-- These indexes significantly improve:
-- 1. User authentication and profile queries (email, role)
-- 2. User's test history and results (user_id + created_at)
-- 3. Transaction history and status filtering
-- 4. Token validation (refresh, password reset, email verification)
-- 5. Admin dashboard queries (pending approvals, transaction status)
-- 6. Event registration lookups
-- 7. Article category filtering

-- To monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- To identify missing indexes:
-- SELECT schemaname, tablename, attname, n_distinct, correlation
-- FROM pg_stats
-- WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
-- ORDER BY abs(correlation) DESC;
