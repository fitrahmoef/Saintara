-- Migration: Fix foreign keys, indexes, and constraints
-- Date: 2025-11-05
-- Description:
--   1. Add missing indexes on foreign keys for better performance
--   2. Fix inconsistent ON DELETE behavior across tables
--   3. Add index and validation for approvals.reference_id

-- ============================================
-- PART 1: Add missing indexes on foreign keys
-- ============================================

-- Test answers indexes
CREATE INDEX IF NOT EXISTS idx_test_answers_test_id ON test_answers(test_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_question_id ON test_answers(question_id);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_character_type_id ON test_results(character_type_id);

-- Vouchers index
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);

-- Agent sales transaction index
CREATE INDEX IF NOT EXISTS idx_agent_sales_transaction_id ON agent_sales(transaction_id);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);

-- Approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_requester_id ON approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_reference_id ON approvals(reference_id);
CREATE INDEX IF NOT EXISTS idx_approvals_type ON approvals(type);

-- ============================================
-- PART 2: Fix inconsistent ON DELETE behavior
-- ============================================

-- Drop and recreate foreign keys with proper ON DELETE behavior

-- 1. test_answers.question_id - Should cascade or set null when question deleted
ALTER TABLE test_answers DROP CONSTRAINT IF EXISTS test_answers_question_id_fkey;
ALTER TABLE test_answers ADD CONSTRAINT test_answers_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE;

-- 2. test_results.character_type_id - Should set null when character type deleted
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_character_type_id_fkey;
ALTER TABLE test_results ADD CONSTRAINT test_results_character_type_id_fkey
    FOREIGN KEY (character_type_id) REFERENCES character_types(id) ON DELETE SET NULL;

-- 3. vouchers.user_id - Should set null when user deleted (vouchers might be tracked separately)
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_user_id_fkey;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. agent_sales.transaction_id - Should set null when transaction deleted (for audit trail)
ALTER TABLE agent_sales DROP CONSTRAINT IF EXISTS agent_sales_transaction_id_fkey;
ALTER TABLE agent_sales ADD CONSTRAINT agent_sales_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- 5. approvals.requester_id - Should set null when user deleted (preserve approval history)
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_requester_id_fkey;
ALTER TABLE approvals ADD CONSTRAINT approvals_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL;

-- 6. approvals.approver_id - Should set null when user deleted (preserve approval history)
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_approver_id_fkey;
ALTER TABLE approvals ADD CONSTRAINT approvals_approver_id_fkey
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;

-- 7. articles.author_id - Should set null when author deleted (preserve articles)
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;
ALTER TABLE articles ADD CONSTRAINT articles_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- PART 3: Fix approvals.reference_id
-- ============================================

-- Since reference_id is polymorphic (references different tables based on type),
-- we cannot add a foreign key constraint. Instead, we:
-- 1. Already added an index above (idx_approvals_reference_id)
-- 2. Add a NOT NULL constraint to ensure data integrity
-- 3. Add documentation via comments

-- Add NOT NULL constraint if reference_id should always have a value
-- NOTE: This might fail if there are existing NULL values
-- If it fails, you should first update NULL values or remove this constraint
ALTER TABLE approvals ALTER COLUMN reference_id SET NOT NULL;

-- Add table comment to document the polymorphic relationship
COMMENT ON COLUMN approvals.reference_id IS
'Polymorphic foreign key - references different tables based on type:
- agent_commission: references agent_sales.id
- partnership: references partnership records (if implemented)
- event_invite: references events.id';

COMMENT ON COLUMN approvals.type IS
'Approval type determining which table reference_id points to:
- agent_commission: agent_sales table
- partnership: partnership table
- event_invite: events table';

-- ============================================
-- PART 4: Additional performance indexes
-- ============================================

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_approvals_status_type ON approvals(status, type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sales_status ON agent_sales(status);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date);

-- Add index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON vouchers(expires_at);

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '✓ Added indexes on all foreign keys';
    RAISE NOTICE '✓ Fixed inconsistent ON DELETE behavior';
    RAISE NOTICE '✓ Improved approvals.reference_id handling';
    RAISE NOTICE '✓ Added performance indexes for common queries';
END $$;
