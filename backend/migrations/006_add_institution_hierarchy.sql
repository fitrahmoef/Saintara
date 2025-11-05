-- Migration: Add Institution and Hierarchical Admin System
-- Description: Adds multi-tenancy support with institution management and hierarchical roles
-- Date: 2025-11-05

-- =====================================================
-- 1. CREATE INSTITUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    max_users INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    subscription_type VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
    subscription_expires_at TIMESTAMP,
    created_by INTEGER, -- superadmin who created this institution
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX idx_institutions_code ON institutions(code);
CREATE INDEX idx_institutions_active ON institutions(is_active);
CREATE INDEX idx_institutions_created_by ON institutions(created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. MODIFY USERS TABLE - ADD INSTITUTION FIELDS
-- =====================================================

-- Add institution_id column
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;

-- Add managed_by_admin_id (for customer managed by institution admin)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS managed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Update role constraint to include new roles
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'superadmin', 'institution_admin', 'admin', 'agent'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_managed_by_admin ON users(managed_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_role_institution ON users(role, institution_id);

-- =====================================================
-- 3. CREATE PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- customer, transaction, test, report, institution
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, import, export, approve
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- =====================================================
-- 4. CREATE ROLE_PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    scope VARCHAR(50) DEFAULT 'own', -- own, institution, all
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_id)
);

-- Add indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- =====================================================
-- 5. CREATE USER_PERMISSIONS TABLE (for custom permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id, institution_id)
);

-- Add indexes
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_institution ON user_permissions(institution_id);

-- =====================================================
-- 6. CREATE CUSTOMER_TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tags (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, name)
);

-- Add indexes
CREATE INDEX idx_customer_tags_institution ON customer_tags(institution_id);

-- Add trigger
CREATE TRIGGER update_customer_tags_updated_at
    BEFORE UPDATE ON customer_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREATE CUSTOMER_TAG_ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, tag_id)
);

-- Add indexes
CREATE INDEX idx_customer_tag_assignments_customer ON customer_tag_assignments(customer_id);
CREATE INDEX idx_customer_tag_assignments_tag ON customer_tag_assignments(tag_id);

-- =====================================================
-- 8. CREATE BULK_IMPORT_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bulk_import_logs (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    errors JSONB, -- Array of error objects {row, email, error}
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_bulk_import_logs_institution ON bulk_import_logs(institution_id);
CREATE INDEX idx_bulk_import_logs_imported_by ON bulk_import_logs(imported_by);
CREATE INDEX idx_bulk_import_logs_status ON bulk_import_logs(status);

-- =====================================================
-- 9. SEED DEFAULT PERMISSIONS
-- =====================================================
INSERT INTO permissions (code, name, resource, action, description) VALUES
    -- Customer Management
    ('customer.create', 'Create Customer', 'customer', 'create', 'Create new customer accounts'),
    ('customer.read', 'View Customers', 'customer', 'read', 'View customer list and details'),
    ('customer.update', 'Update Customer', 'customer', 'update', 'Edit customer information'),
    ('customer.delete', 'Delete Customer', 'customer', 'delete', 'Delete customer accounts'),
    ('customer.import', 'Import Customers', 'customer', 'import', 'Bulk import customers via CSV/Excel'),
    ('customer.export', 'Export Customers', 'customer', 'export', 'Export customer data to CSV/Excel'),

    -- Transaction Management
    ('transaction.read', 'View Transactions', 'transaction', 'read', 'View transaction history'),
    ('transaction.create', 'Create Transaction', 'transaction', 'create', 'Create new transactions'),
    ('transaction.update', 'Update Transaction', 'transaction', 'update', 'Update transaction status'),
    ('transaction.approve', 'Approve Transaction', 'transaction', 'approve', 'Approve payment transactions'),
    ('transaction.refund', 'Refund Transaction', 'transaction', 'refund', 'Process refunds'),

    -- Test Management
    ('test.assign', 'Assign Test', 'test', 'create', 'Assign tests to customers'),
    ('test.read', 'View Tests', 'test', 'read', 'View test list'),
    ('test.results.read', 'View Test Results', 'test', 'read', 'View customer test results'),
    ('test.delete', 'Delete Test', 'test', 'delete', 'Delete test records'),

    -- Voucher Management
    ('voucher.create', 'Create Voucher', 'voucher', 'create', 'Create new vouchers'),
    ('voucher.read', 'View Vouchers', 'voucher', 'read', 'View voucher list'),
    ('voucher.update', 'Update Voucher', 'voucher', 'update', 'Edit voucher details'),
    ('voucher.delete', 'Delete Voucher', 'voucher', 'delete', 'Delete vouchers'),

    -- Agent Management
    ('agent.create', 'Create Agent', 'agent', 'create', 'Create new agents'),
    ('agent.read', 'View Agents', 'agent', 'read', 'View agent list'),
    ('agent.update', 'Update Agent', 'agent', 'update', 'Edit agent information'),
    ('agent.approve', 'Approve Commission', 'agent', 'approve', 'Approve agent commissions'),

    -- Event Management
    ('event.create', 'Create Event', 'event', 'create', 'Create new events'),
    ('event.read', 'View Events', 'event', 'read', 'View event list'),
    ('event.update', 'Update Event', 'event', 'update', 'Edit event details'),
    ('event.delete', 'Delete Event', 'event', 'delete', 'Delete events'),

    -- Report Access
    ('report.institution', 'Institution Reports', 'report', 'read', 'View institution analytics and reports'),
    ('report.financial', 'Financial Reports', 'report', 'read', 'View financial reports and statistics'),
    ('report.export', 'Export Reports', 'report', 'export', 'Export reports to PDF/Excel'),

    -- Institution Management (Superadmin only)
    ('institution.create', 'Create Institution', 'institution', 'create', 'Create new institutions'),
    ('institution.read', 'View Institutions', 'institution', 'read', 'View institution list'),
    ('institution.update', 'Update Institution', 'institution', 'update', 'Edit institution settings'),
    ('institution.delete', 'Delete Institution', 'institution', 'delete', 'Delete institutions'),
    ('institution.assign_admin', 'Assign Admin', 'institution', 'update', 'Assign institution administrators'),

    -- Approval Management
    ('approval.read', 'View Approvals', 'approval', 'read', 'View approval requests'),
    ('approval.approve', 'Approve Request', 'approval', 'approve', 'Approve/reject approval requests')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 10. SEED DEFAULT ROLE PERMISSIONS
-- =====================================================

-- SUPERADMIN - Full access to everything
INSERT INTO role_permissions (role, permission_id, scope)
SELECT 'superadmin', id, 'all' FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- INSTITUTION_ADMIN - Institution-scoped access
INSERT INTO role_permissions (role, permission_id, scope)
SELECT 'institution_admin', id, 'institution' FROM permissions
WHERE resource IN ('customer', 'transaction', 'test', 'voucher', 'event', 'report', 'agent')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ADMIN - Own-scoped access (legacy compatibility)
INSERT INTO role_permissions (role, permission_id, scope)
SELECT 'admin', id, 'institution' FROM permissions
WHERE resource IN ('customer', 'transaction', 'test', 'approval')
ON CONFLICT (role, permission_id) DO NOTHING;

-- AGENT - Limited access
INSERT INTO role_permissions (role, permission_id, scope)
SELECT 'agent', id, 'own' FROM permissions
WHERE code IN ('customer.read', 'transaction.read', 'agent.read', 'report.financial')
ON CONFLICT (role, permission_id) DO NOTHING;

-- =====================================================
-- 11. UPDATE EXISTING DATA (Migration)
-- =====================================================

-- Update existing admins to superadmin role
UPDATE users
SET role = 'superadmin'
WHERE role = 'admin';

-- =====================================================
-- 12. ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key from institutions.created_by to users.id
ALTER TABLE institutions
    ADD CONSTRAINT fk_institutions_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- 13. CREATE VIEWS FOR ANALYTICS
-- =====================================================

-- View for institution statistics
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
    i.created_at AS institution_created_at
FROM institutions i
LEFT JOIN users u ON u.institution_id = i.id
LEFT JOIN tests t ON t.user_id = u.id
LEFT JOIN transactions tr ON tr.user_id = u.id
GROUP BY i.id, i.name, i.code, i.created_at;

-- View for admin hierarchy
CREATE OR REPLACE VIEW admin_hierarchy AS
SELECT
    u.id AS admin_id,
    u.email AS admin_email,
    u.name AS admin_name,
    u.role AS admin_role,
    i.id AS institution_id,
    i.name AS institution_name,
    i.code AS institution_code,
    COUNT(DISTINCT c.id) AS managed_customers_count
FROM users u
LEFT JOIN institutions i ON u.institution_id = i.id
LEFT JOIN users c ON c.managed_by_admin_id = u.id
WHERE u.role IN ('superadmin', 'institution_admin', 'admin')
GROUP BY u.id, u.email, u.name, u.role, i.id, i.name, i.code;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE institutions IS 'Stores institution/organization information for multi-tenancy';
COMMENT ON TABLE permissions IS 'Defines all available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles with scope (own, institution, all)';
COMMENT ON TABLE user_permissions IS 'Custom permissions assigned to specific users';
COMMENT ON TABLE customer_tags IS 'Tags for customer segmentation within institutions';
COMMENT ON TABLE bulk_import_logs IS 'Tracks bulk customer import operations';

COMMENT ON COLUMN users.institution_id IS 'Institution this user belongs to (NULL for individual users)';
COMMENT ON COLUMN users.managed_by_admin_id IS 'Admin who manages this customer (for institution customers)';
COMMENT ON COLUMN institutions.max_users IS 'Maximum number of users allowed for this institution';
COMMENT ON COLUMN institutions.subscription_type IS 'Subscription tier: basic, premium, enterprise';
