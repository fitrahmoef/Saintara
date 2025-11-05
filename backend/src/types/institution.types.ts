/**
 * Institution and Permission System Types
 * Defines TypeScript types for multi-tenancy and hierarchical admin system
 */

// =====================================================
// INSTITUTION TYPES
// =====================================================

export interface Institution {
  id: number;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  max_users: number;
  is_active: boolean;
  subscription_type: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at?: Date;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInstitutionDto {
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  max_users?: number;
  subscription_type?: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at?: Date;
}

export interface UpdateInstitutionDto {
  name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  max_users?: number;
  is_active?: boolean;
  subscription_type?: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at?: Date;
}

export interface InstitutionStatistics {
  institution_id: number;
  institution_name: string;
  institution_code: string;
  total_customers: number;
  active_customers: number;
  total_tests: number;
  completed_tests: number;
  total_transactions: number;
  total_revenue: number;
  institution_created_at: Date;
}

// =====================================================
// PERMISSION TYPES
// =====================================================

export interface Permission {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
}

export interface RolePermission {
  id: number;
  role: UserRole;
  permission_id: number;
  scope: PermissionScope;
  created_at: Date;
}

export interface UserPermission {
  id: number;
  user_id: number;
  permission_id: number;
  institution_id?: number;
  granted_by?: number;
  granted_at: Date;
}

export type PermissionScope = 'own' | 'institution' | 'all';

export type PermissionResource =
  | 'customer'
  | 'transaction'
  | 'test'
  | 'voucher'
  | 'agent'
  | 'event'
  | 'report'
  | 'institution'
  | 'approval';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'import'
  | 'export'
  | 'approve';

// =====================================================
// USER ROLE TYPES (Extended)
// =====================================================

export type UserRole =
  | 'user'
  | 'superadmin'
  | 'institution_admin'
  | 'admin'
  | 'agent';

export interface ExtendedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  institution_id?: number;
  managed_by_admin_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// CUSTOMER TAG TYPES
// =====================================================

export interface CustomerTag {
  id: number;
  institution_id: number;
  name: string;
  color: string;
  description?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerTagDto {
  institution_id: number;
  name: string;
  color?: string;
  description?: string;
}

export interface CustomerTagAssignment {
  customer_id: number;
  tag_id: number;
  assigned_by?: number;
  assigned_at: Date;
}

// =====================================================
// BULK IMPORT TYPES
// =====================================================

export interface BulkImportLog {
  id: number;
  institution_id: number;
  imported_by?: number;
  file_name: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors?: BulkImportError[];
  status: 'processing' | 'completed' | 'failed';
  imported_at: Date;
}

export interface BulkImportError {
  row: number;
  email?: string;
  error: string;
  field?: string;
}

export interface BulkImportCustomerDto {
  email: string;
  name: string;
  password: string;
  phone?: string;
  gender?: string;
  blood_type?: string;
  country?: string;
  city?: string;
  nickname?: string;
}

export interface BulkImportResult {
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: BulkImportError[];
  log_id: number;
}

// =====================================================
// ADMIN HIERARCHY TYPES
// =====================================================

export interface AdminHierarchy {
  admin_id: number;
  admin_email: string;
  admin_name: string;
  admin_role: UserRole;
  institution_id?: number;
  institution_name?: string;
  institution_code?: string;
  managed_customers_count: number;
}

export interface AssignAdminDto {
  user_id: number;
  institution_id: number;
  role: 'institution_admin' | 'admin';
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CustomerListQuery {
  institution_id?: number;
  tag_id?: number;
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'email' | 'created_at' | 'last_test_date';
  sort_order?: 'asc' | 'desc';
}

export interface InstitutionAnalytics {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  tests_completed_this_month: number;
  test_completion_rate: number;
  most_common_personality?: string;
  customer_growth: {
    [month: string]: number;
  };
  test_distribution: {
    personal: number;
    couple: number;
    family: number;
    team: number;
  };
  revenue_this_month: number;
  total_revenue: number;
}

// =====================================================
// AUTHORIZATION CONTEXT
// =====================================================

export interface AuthContext {
  user_id: number;
  email: string;
  role: UserRole;
  institution_id?: number;
  permissions: string[];
}

export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
  scope?: PermissionScope;
  target_institution_id?: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: any[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
