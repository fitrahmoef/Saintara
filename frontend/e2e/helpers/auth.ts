/**
 * Authentication helpers for E2E tests
 */
import { Page } from '@playwright/test';
import { TEST_USER, ROUTES } from './test-data';

export async function loginAsTestUser(page: Page, credentials = TEST_USER) {
  await page.goto(ROUTES.login);

  // Fill login form
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation or success indicator
  await page.waitForURL(ROUTES.dashboard, { timeout: 10000 });
}

export async function registerTestUser(page: Page, userData = TEST_USER) {
  await page.goto(ROUTES.register);

  // Fill registration form
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="username"]', userData.username);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="confirmPassword"]', userData.password);

  if (userData.fullName) {
    await page.fill('input[name="fullName"]', userData.fullName);
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for success (either redirect or success message)
  await page.waitForTimeout(2000);
}

export async function logout(page: Page) {
  // Find and click logout button (adjust selector based on your UI)
  await page.click('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Keluar")');

  // Wait for redirect to home or login
  await page.waitForURL(/\/(login|)$/, { timeout: 5000 });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we can access protected route
    await page.goto(ROUTES.dashboard);
    await page.waitForURL(ROUTES.dashboard, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
