/**
 * Test data helpers for E2E tests
 */

export const generateUniqueEmail = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
};

export const generateUsername = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `testuser_${timestamp}_${random}`;
};

export const TEST_USER = {
  email: generateUniqueEmail(),
  username: generateUsername(),
  password: 'Test123!@#',
  fullName: 'Test User E2E',
};

export const ADMIN_USER = {
  email: 'admin@saintara.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!@#',
};

export const API_ENDPOINTS = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  profile: '/api/auth/profile',
};

export const ROUTES = {
  home: '/',
  register: '/register',
  login: '/login',
  dashboard: '/dashboard',
  admin: '/admin/dashboard',
  calendar: '/calendar',
};
