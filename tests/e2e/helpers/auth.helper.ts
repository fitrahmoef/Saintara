import { Page } from '@playwright/test';

/**
 * Authentication Helper Functions
 * Reusable functions for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  fullName?: string;
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/register');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  if (user.fullName) {
    await page.fill('input[name="fullName"]', user.fullName);
  }
  await page.check('input[type="checkbox"][name="acceptTerms"]');
  await page.click('button[type="submit"]');
}

export async function logoutUser(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=/logout|keluar/i');
  await page.waitForURL(/\/(|auth\/login)/);
}

export function generateTestUser(): TestUser {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    fullName: `Test User ${Date.now()}`,
  };
}
