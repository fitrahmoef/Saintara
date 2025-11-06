-- Migration: Add Performance Indexes
-- Description: Add JSONB indexes for personality searches and improve pagination performance
-- Author: Claude
-- Date: 2025-11-06

-- JSONB indexes for personality_traits searches (GIN index for fast JSONB queries)
CREATE INDEX IF NOT EXISTS idx_test_results_personality_traits_gin
    ON test_results USING GIN (personality_traits);

CREATE INDEX IF NOT EXISTS idx_test_results_score_breakdown_gin
    ON test_results USING GIN (score_breakdown);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tests_user_id_status_created
    ON tests(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tests_status_created
    ON tests(status, created_at DESC)
    WHERE status IN ('pending', 'completed');

CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status_created
    ON transactions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status_created
    ON transactions(status, created_at DESC);

-- Index for article searches
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
    ON articles USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_is_published_created
    ON articles(is_published, created_at DESC)
    WHERE is_published = true;

-- Index for voucher lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_code
    ON vouchers(code)
    WHERE is_used = false;

-- Index for character type code lookups
CREATE INDEX IF NOT EXISTS idx_character_types_code
    ON character_types(code);

-- Composite index for event queries
CREATE INDEX IF NOT EXISTS idx_events_status_date
    ON events(status, event_date DESC);

-- Add id DESC indexes for cursor-based pagination (performance optimization)
CREATE INDEX IF NOT EXISTS idx_users_id_desc ON users(id DESC);
CREATE INDEX IF NOT EXISTS idx_tests_id_desc ON tests(id DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_id_desc ON transactions(id DESC);
CREATE INDEX IF NOT EXISTS idx_articles_id_desc ON articles(id DESC);

-- Vacuum analyze to update statistics after adding indexes
VACUUM ANALYZE users;
VACUUM ANALYZE tests;
VACUUM ANALYZE test_results;
VACUUM ANALYZE transactions;
VACUUM ANALYZE articles;
VACUUM ANALYZE events;
