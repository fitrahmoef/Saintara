# Database Migrations

This directory contains SQL migration files for the Saintara database.

## Migration Files

### fix_foreign_keys_and_indexes.sql
**Date:** 2025-11-05

This migration fixes several database issues:

#### 1. Missing Indexes on Foreign Keys
Added indexes to improve query performance:
- `test_answers.test_id` and `test_answers.question_id`
- `test_results.test_id` and `test_results.character_type_id`
- `vouchers.user_id`
- `agent_sales.transaction_id`
- `event_registrations.event_id` and `event_registrations.user_id`
- `approvals.requester_id`, `approvals.approver_id`, and `approvals.reference_id`

#### 2. Inconsistent ON DELETE Behavior
Standardized foreign key constraints:

**CASCADE (delete dependent records):**
- `test_answers.test_id` → tests
- `test_answers.question_id` → test_questions

**SET NULL (preserve records, remove reference):**
- `test_results.character_type_id` → character_types
- `vouchers.user_id` → users
- `agent_sales.transaction_id` → transactions
- `approvals.requester_id` → users
- `approvals.approver_id` → users
- `articles.author_id` → users

#### 3. Approvals Reference ID
The `approvals.reference_id` column is a polymorphic foreign key:
- Cannot have a traditional foreign key constraint
- References different tables based on `approvals.type`:
  - `agent_commission` → `agent_sales.id`
  - `partnership` → partnership records
  - `event_invite` → `events.id`
- Added NOT NULL constraint for data integrity
- Added index for performance
- Added documentation via table comments

#### 4. Additional Performance Indexes
Added composite and timestamp indexes:
- `approvals(status, type)` - for filtered queries
- `transactions(status)` - for status-based queries
- `agent_sales(status)` - for commission tracking
- `events(status, event_date)` - for event listings
- Timestamp indexes for time-based queries

## How to Run Migrations

### Option 1: Using psql
```bash
psql -U your_username -d saintara_db -f migrations/fix_foreign_keys_and_indexes.sql
```

### Option 2: From Node.js
```javascript
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const migration = fs.readFileSync('migrations/fix_foreign_keys_and_indexes.sql', 'utf8');
await pool.query(migration);
```

### Option 3: Using migration tool
If you're using a migration tool like node-pg-migrate or Flyway, follow its conventions.

## Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Check NULL Values**: The migration sets `reference_id` to NOT NULL. If you have existing NULL values, the migration will fail. Update or delete these records first.
3. **Downtime**: Some operations may lock tables temporarily. Run during low-traffic periods if possible.
4. **Testing**: Test migrations on a staging environment first

## Schema Changes Summary

| Table | Change | Impact |
|-------|--------|--------|
| test_answers | Added indexes, fixed FK constraint | Better query performance |
| test_results | Added indexes, fixed FK constraint | Better query performance, data preserved on character type deletion |
| vouchers | Added index, fixed FK constraint | Better query performance, vouchers preserved on user deletion |
| agent_sales | Added index, fixed FK constraint | Better query performance, audit trail preserved |
| approvals | Added indexes, fixed FK constraints, added NOT NULL | Better query performance, approval history preserved |
| articles | Fixed FK constraint | Articles preserved when author deleted |
| events | Added composite index | Better event listing performance |
| transactions | Added status index | Better transaction filtering |

## Rollback

If you need to rollback these changes, you'll need to:
1. Drop the added indexes
2. Restore the original foreign key constraints
3. Remove the NOT NULL constraint from `approvals.reference_id`

Contact the database administrator for assistance with rollbacks.
