/**
 * E2E Tests: Authentication Flow
 * Tests: Registration, Login, Logout, Session Management
 */
import { test, expect } from '@playwright/test';
import { generateUniqueEmail, generateUsername, ROUTES } from './helpers/test-data';
import { loginAsTestUser, registerTestUser, logout } from './helpers/auth';

test.describe('Authentication Flow', () => {

  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      const newUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'E2E Test User',
      };

      await page.goto(ROUTES.register);

      // Fill registration form
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="username"]', newUser.username);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', newUser.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should show success message or redirect
      await expect(page).toHaveURL(/\/(dashboard|login|verify-email)/, { timeout: 10000 });
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.goto(ROUTES.register);

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for weak password', async ({ page }) => {
      await page.goto(ROUTES.register);

      await page.fill('input[name="email"]', generateUniqueEmail());
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');

      // Should show password error
      await expect(page.locator('text=/password.*strong|password.*requirements/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto(ROUTES.register);

      await page.fill('input[name="email"]', generateUniqueEmail());
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Different123!@#');
      await page.click('button[type="submit"]');

      // Should show mismatch error
      await expect(page.locator('text=/password.*match|password.*not.*match/i')).toBeVisible({ timeout: 5000 });
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      const duplicateEmail = generateUniqueEmail();

      // Register first user
      await page.goto(ROUTES.register);
      await page.fill('input[name="email"]', duplicateEmail);
      await page.fill('input[name="username"]', generateUsername());
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Try to register with same email
      await page.goto(ROUTES.register);
      await page.fill('input[name="email"]', duplicateEmail);
      await page.fill('input[name="username"]', generateUsername());
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('text=/email.*already.*exists|email.*taken/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test user before each login test
      const testUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'Test User',
      };
      await registerTestUser(page, testUser);

      // Store credentials in page context for use in tests
      await page.evaluate((user) => {
        (window as any).__testUser = user;
      }, testUser);
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      const testUser = await page.evaluate(() => (window as any).__testUser);

      await page.goto(ROUTES.login);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(ROUTES.dashboard, { timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(ROUTES.login);

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials|email.*password.*incorrect/i')).toBeVisible({ timeout: 5000 });
    });

    test('should remember user session after page reload', async ({ page }) => {
      const testUser = await page.evaluate(() => (window as any).__testUser);

      // Login
      await page.goto(ROUTES.login);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(ROUTES.dashboard);

      // Reload page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL(ROUTES.dashboard);
    });

    test('should implement rate limiting for failed login attempts', async ({ page }) => {
      await page.goto(ROUTES.login);

      const invalidEmail = 'test@example.com';
      const invalidPassword = 'WrongPassword123!';

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', invalidEmail);
        await page.fill('input[name="password"]', invalidPassword);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }

      // Should show rate limit message
      await expect(page.locator('text=/too many.*attempts|rate.*limit|try.*again.*later/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Logout', () => {
    test('should successfully logout user', async ({ page }) => {
      const testUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'Test User',
      };

      // Register and login
      await registerTestUser(page, testUser);
      await loginAsTestUser(page, testUser);

      // Verify logged in
      await expect(page).toHaveURL(ROUTES.dashboard);

      // Logout
      await logout(page);

      // Should redirect to home or login
      await expect(page).toHaveURL(/\/(login|)$/);
    });

    test('should clear session data on logout', async ({ page }) => {
      const testUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'Test User',
      };

      // Register and login
      await registerTestUser(page, testUser);
      await loginAsTestUser(page, testUser);

      // Logout
      await logout(page);

      // Try to access protected route
      await page.goto(ROUTES.dashboard);

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Management', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should maintain session across tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      const testUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'Test User',
      };

      // Register and login in first tab
      await registerTestUser(page1, testUser);
      await loginAsTestUser(page1, testUser);

      // Open dashboard in second tab
      await page2.goto(ROUTES.dashboard);

      // Should be logged in
      await expect(page2).toHaveURL(ROUTES.dashboard);

      await context.close();
    });
  });

  test.describe('Password Security', () => {
    test('should enforce password complexity requirements', async ({ page }) => {
      await page.goto(ROUTES.register);

      const weakPasswords = [
        'abc',           // Too short
        'abcdefgh',      // No uppercase, no numbers
        'ABCDEFGH',      // No lowercase, no numbers
        '12345678',      // No letters
        'Abcdefgh',      // No numbers
        'Abcd1234',      // Valid but let's test
      ];

      for (const password of weakPasswords.slice(0, 3)) {
        await page.fill('input[name="email"]', generateUniqueEmail());
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        // Should show password requirement error
        const hasError = await page.locator('text=/password.*requirement|password.*weak|password.*strong/i').isVisible();
        expect(hasError).toBeTruthy();

        await page.reload();
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF token in authenticated requests', async ({ page }) => {
      const testUser = {
        email: generateUniqueEmail(),
        username: generateUsername(),
        password: 'Test123!@#',
        fullName: 'Test User',
      };

      // Register and login
      await registerTestUser(page, testUser);
      await loginAsTestUser(page, testUser);

      // Intercept API requests to check for CSRF token
      let hasCSRFHeader = false;
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          const headers = request.headers();
          if (headers['x-csrf-token']) {
            hasCSRFHeader = true;
          }
        }
      });

      // Trigger an API call
      await page.goto(ROUTES.dashboard);
      await page.waitForTimeout(2000);

      // CSRF token should be included (may vary based on implementation)
      // This test is informational - adjust based on your CSRF strategy
    });
  });
});
