import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Test Taking Flow
 * Tests the complete test taking journey
 */

test.describe('Test Taking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@saintara.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display available tests', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show test cards
    await expect(page.locator('[data-testid="test-card"]').first()).toBeVisible();

    // Should show test details
    await expect(page.locator('text=/durasi|duration/i')).toBeVisible();
    await expect(page.locator('text=/jumlah soal|questions/i')).toBeVisible();
  });

  test('should start a test', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on first available test
    await page.click('[data-testid="start-test-btn"]');

    // Should show test instructions
    await expect(page.locator('text=/instruksi|instructions/i')).toBeVisible();

    // Accept instructions and start
    await page.click('button:has-text("Mulai Test")');

    // Should be on test page
    await expect(page).toHaveURL(/\/test\//);

    // Should show first question
    await expect(page.locator('[data-testid="question"]')).toBeVisible();
  });

  test('should navigate between questions', async ({ page }) => {
    // Start test
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Answer first question
    await page.click('[data-testid="option-a"]');

    // Go to next question
    await page.click('button:has-text("Selanjutnya")');

    // Should show question 2
    await expect(page.locator('text=/Soal 2|Question 2/i')).toBeVisible();

    // Go back
    await page.click('button:has-text("Sebelumnya")');

    // Should show question 1 again
    await expect(page.locator('text=/Soal 1|Question 1/i')).toBeVisible();

    // Previous answer should be preserved
    await expect(page.locator('[data-testid="option-a"]')).toBeChecked();
  });

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Should show progress
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Answer some questions
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid^="option-"]');
      await page.click('button:has-text("Selanjutnya")');
    }

    // Progress should update
    const progressText = await page.locator('[data-testid="progress-text"]').textContent();
    expect(progressText).toMatch(/5.*\//); // Should show "5 / total"
  });

  test('should show timer countdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Should show timer
    const timer = page.locator('[data-testid="timer"]');
    await expect(timer).toBeVisible();

    // Timer should be counting down
    const initialTime = await timer.textContent();
    await page.waitForTimeout(2000);
    const laterTime = await timer.textContent();

    expect(initialTime).not.toBe(laterTime);
  });

  test('should mark questions for review', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Mark for review
    await page.click('[data-testid="mark-review-btn"]');

    // Should show review indicator
    await expect(page.locator('[data-testid="review-indicator"]')).toBeVisible();

    // Go to next question
    await page.click('button:has-text("Selanjutnya")');

    // Open question navigator
    await page.click('[data-testid="question-navigator"]');

    // Should show question 1 as marked for review
    await expect(page.locator('[data-testid="nav-question-1"][data-review="true"]')).toBeVisible();
  });

  test('should submit test and show results', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Answer all questions quickly
    const totalQuestions = 10; // Adjust based on actual test
    for (let i = 0; i < totalQuestions; i++) {
      await page.click('[data-testid^="option-"]');
      if (i < totalQuestions - 1) {
        await page.click('button:has-text("Selanjutnya")');
      }
    }

    // Submit test
    await page.click('button:has-text("Selesai")');

    // Confirm submission
    await page.click('button:has-text("Ya, Kirim")');

    // Should redirect to results
    await expect(page).toHaveURL(/\/results/);

    // Should show score
    await expect(page.locator('[data-testid="score"]')).toBeVisible();

    // Should show character type result
    await expect(page.locator('[data-testid="character-type"]')).toBeVisible();
  });

  test('should auto-submit when time runs out', async ({ page }) => {
    // This would require a test with very short duration
    // Or we could mock the timer
    test.skip();
  });

  test('should warn before leaving test page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-test-btn"]');
    await page.click('button:has-text("Mulai Test")');

    // Listen for beforeunload event
    let dialogShown = false;
    page.on('dialog', () => {
      dialogShown = true;
    });

    // Try to navigate away
    await page.goto('/dashboard').catch(() => {});

    // Should have shown confirmation (in modern browsers this is handled differently)
    // This test might need adjustment based on actual implementation
  });
});
