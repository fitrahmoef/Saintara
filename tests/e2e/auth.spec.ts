import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * Tests registration, login, logout, and password reset
 */

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    fullName: 'Test User',
  };

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.fill('input[name="fullName"]', testUser.fullName);

    // Accept terms
    await page.check('input[type="checkbox"][name="acceptTerms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to verification page or dashboard
    await expect(page).toHaveURL(/\/(verify-email|dashboard)/);

    // Should show success message
    await expect(page.locator('text=/registrasi berhasil|registration successful/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@saintara.com');
    await page.fill('input[name="password"]', 'admin123');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);

    // Should show user menu or profile
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid credentials|email atau password salah/i')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@saintara.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=/logout|keluar/i');

    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(|auth\/login)/);

    // Should clear auth cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'token');
    expect(authCookie).toBeUndefined();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Request password reset
    await page.fill('input[name="email"]', 'admin@saintara.com');
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/email terkirim|email sent/i')).toBeVisible();
  });

  test('should enforce password requirements', async ({ page }) => {
    await page.goto('/auth/register');

    // Try weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    // Should show validation error
    await expect(page.locator('text=/password.*minimal|password.*characters/i')).toBeVisible();
  });
});
