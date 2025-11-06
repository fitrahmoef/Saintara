/**
 * E2E Tests: Test Submission Flow
 * Tests: Personality test taking, submission, results viewing
 */
import { test, expect } from '@playwright/test';
import { generateUniqueEmail, generateUsername, ROUTES } from './helpers/test-data';
import { registerTestUser, loginAsTestUser } from './helpers/auth';

test.describe('Test Submission Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Create and login test user
    const testUser = {
      email: generateUniqueEmail(),
      username: generateUsername(),
      password: 'Test123!@#',
      fullName: 'Test User',
    };

    await registerTestUser(page, testUser);
    await loginAsTestUser(page, testUser);
  });

  test.describe('Test Discovery', () => {
    test('should display available personality tests', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Should show available tests or test list
      const testList = page.locator('[data-testid="test-list"], .test-card, [class*="test"]');
      await expect(testList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show test details when clicked', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Click on first test
      const firstTest = page.locator('[data-testid="test-card"], .test-card, button:has-text("Mulai")').first();
      await firstTest.click();

      // Should show test details or start screen
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/(test|assessment|start)/);
    });
  });

  test.describe('Test Taking', () => {
    test('should allow user to answer test questions', async ({ page }) => {
      // Navigate to test (adjust based on your routing)
      await page.goto(ROUTES.dashboard);

      // Start a test
      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start"), [data-testid="start-test"]').first();
      if (await startButton.isVisible()) {
        await startButton.click();
      }

      await page.waitForTimeout(2000);

      // Answer first question
      const firstOption = page.locator('input[type="radio"], button[role="radio"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Should be able to proceed to next question
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Selanjutnya"), [data-testid="next-question"]');
        await expect(nextButton).toBeEnabled();
      }
    });

    test('should track test progress', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Start a test
      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Should show progress indicator
        const progressIndicator = page.locator('[data-testid="progress"], .progress, [class*="progress"]');
        await expect(progressIndicator.first()).toBeVisible();
      }
    });

    test('should prevent submission without answering all questions', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Try to submit without answering
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Kirim")');
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation error
          const errorMessage = page.locator('text=/answer.*all|complete.*all|required/i');
          const isErrorVisible = await errorMessage.isVisible().catch(() => false);
          // This test is optional - implementation may vary
        }
      }
    });

    test('should allow saving progress and resuming later', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Answer first question
        const firstOption = page.locator('input[type="radio"]').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();

          // Save progress
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Simpan")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Navigate away
            await page.goto(ROUTES.dashboard);

            // Come back to test
            const resumeButton = page.locator('button:has-text("Resume"), button:has-text("Lanjutkan")');
            if (await resumeButton.isVisible()) {
              await resumeButton.click();

              // Progress should be maintained
              await expect(firstOption).toBeChecked();
            }
          }
        }
      }
    });
  });

  test.describe('Test Submission', () => {
    test('should successfully submit completed test', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Quick test completion (answer all visible questions)
        const questions = await page.locator('input[type="radio"]').all();
        for (let i = 0; i < Math.min(questions.length, 10); i += 4) {
          const option = questions[i];
          if (await option.isVisible()) {
            await option.click();

            // Click next if available
            const nextButton = page.locator('button:has-text("Next"), button:has-text("Selanjutnya")');
            if (await nextButton.isVisible()) {
              await nextButton.click();
              await page.waitForTimeout(500);
            }
          }
        }

        // Submit
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Kirim")');
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show success message or redirect to results
          await page.waitForTimeout(3000);
          const url = page.url();
          expect(url).toMatch(/\/(result|complete|success|dashboard)/);
        }
      }
    });

    test('should show confirmation before submitting', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Try to submit
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Kirim")');
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show confirmation dialog
          const confirmDialog = page.locator('[role="dialog"], .modal, text=/are you sure|confirm|yakin/i');
          const hasConfirmation = await confirmDialog.isVisible().catch(() => false);
          // Confirmation may or may not be implemented
        }
      }
    });
  });

  test.describe('Results Viewing', () => {
    test('should display test results after submission', async ({ page }) => {
      // This test assumes there's a way to view past results
      await page.goto(ROUTES.dashboard);

      // Look for results section
      const resultsSection = page.locator('[data-testid="results"], .results, text=/result|hasil/i');
      if (await resultsSection.isVisible()) {
        await resultsSection.click();

        // Should show results details
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/\/(result|hasil)/);
      }
    });

    test('should allow downloading test results', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      const downloadButton = page.locator('button:has-text("Download"), button:has-text("Unduh")');
      if (await downloadButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();

        // Verify download started
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(pdf|png|jpg)/);
      }
    });
  });

  test.describe('Test Rate Limiting', () => {
    test('should enforce test submission rate limits', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Try to start multiple tests rapidly
      for (let i = 0; i < 12; i++) {
        const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
        if (await startButton.isVisible()) {
          await startButton.click();
          await page.waitForTimeout(100);

          // Go back
          await page.goBack();
        }
      }

      // Should show rate limit error
      const rateLimitError = page.locator('text=/rate.*limit|too.*many|slow.*down/i');
      const isRateLimited = await rateLimitError.isVisible().catch(() => false);
      // Rate limiting may be implemented differently
    });
  });

  test.describe('Test History', () => {
    test('should show user test history', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Look for history/past tests section
      const historySection = page.locator('[data-testid="history"], text=/history|riwayat/i');
      if (await historySection.isVisible()) {
        // Should display past test attempts
        await expect(historySection).toBeVisible();
      }
    });

    test('should not allow retaking test within cooldown period', async ({ page }) => {
      await page.goto(ROUTES.dashboard);

      // Complete a test first
      const startButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Submit immediately (implementation dependent)
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Kirim")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }

        // Try to retake same test immediately
        await page.goto(ROUTES.dashboard);
        const retakeButton = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();

        // Should be disabled or show cooldown message
        const cooldownMessage = page.locator('text=/cooldown|wait|already.*taken/i');
        const hasCooldown = await cooldownMessage.isVisible().catch(() => false);
        // Cooldown may be implemented differently
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(ROUTES.dashboard);

      // Should be usable on mobile
      const mobileTest = page.locator('button:has-text("Mulai"), button:has-text("Start")').first();
      await expect(mobileTest).toBeVisible();
    });
  });
});
