import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Payment Flow
 * Tests payment gateway integration and transaction flow
 */

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@saintara.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display pricing plans', async ({ page }) => {
    await page.goto('/pricing');

    // Should show pricing cards
    await expect(page.locator('[data-testid="pricing-card"]').first()).toBeVisible();

    // Should show plan details
    await expect(page.locator('text=/Rp|IDR/i')).toBeVisible();
    await expect(page.locator('text=/bulan|month/i')).toBeVisible();
  });

  test('should require authentication for checkout', async ({ page, context }) => {
    // Clear cookies to simulate logged out state
    await context.clearCookies();

    await page.goto('/pricing');
    await page.click('[data-testid="buy-plan-btn"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/pricing');

    // Select a plan
    await page.click('[data-testid="buy-plan-premium"]');

    // Should go to checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // Should show order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('text=/total/i')).toBeVisible();
  });

  test('should select payment method', async ({ page }) => {
    await page.goto('/checkout');

    // Should show payment method options
    await expect(page.locator('[data-testid="payment-method-xendit"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-stripe"]')).toBeVisible();

    // Select payment method
    await page.click('[data-testid="payment-method-xendit"]');

    // Should highlight selected method
    await expect(page.locator('[data-testid="payment-method-xendit"]')).toHaveClass(/selected|active/);
  });

  test('should apply discount code', async ({ page }) => {
    await page.goto('/checkout');

    // Enter discount code
    await page.fill('input[name="discountCode"]', 'DISCOUNT10');
    await page.click('button:has-text("Terapkan")');

    // Should show discount applied
    await expect(page.locator('text=/diskon.*diterapkan|discount.*applied/i')).toBeVisible();

    // Should show reduced price
    const discountAmount = await page.locator('[data-testid="discount-amount"]').textContent();
    expect(discountAmount).toMatch(/-.*Rp/);
  });

  test('should validate invalid discount code', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('input[name="discountCode"]', 'INVALID');
    await page.click('button:has-text("Terapkan")');

    // Should show error
    await expect(page.locator('text=/kode.*tidak.*valid|invalid.*code/i')).toBeVisible();
  });

  test('should process payment with Xendit', async ({ page }) => {
    await page.goto('/checkout');

    // Select Xendit payment method
    await page.click('[data-testid="payment-method-xendit"]');

    // Choose payment channel
    await page.click('[data-testid="xendit-channel-va"]');

    // Proceed to payment
    await page.click('button:has-text("Bayar Sekarang")');

    // Should show payment instructions
    await expect(page.locator('[data-testid="payment-instructions"]')).toBeVisible();

    // Should show virtual account number
    await expect(page.locator('[data-testid="va-number"]')).toBeVisible();
  });

  test('should process payment with Stripe', async ({ page }) => {
    await page.goto('/checkout');

    // Select Stripe payment method
    await page.click('[data-testid="payment-method-stripe"]');

    // Proceed to payment
    await page.click('button:has-text("Bayar Sekarang")');

    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com|stripe/);

    // Note: Actual Stripe form filling would be done here in full integration test
  });

  test('should show transaction history', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Should show transaction list
    await expect(page.locator('[data-testid="transaction-item"]').first()).toBeVisible();

    // Should show transaction details
    await expect(page.locator('text=/tanggal|date/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
    await expect(page.locator('text=/jumlah|amount/i')).toBeVisible();
  });

  test('should download invoice', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Click download invoice
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-invoice-btn"]')
    ]);

    // Should download PDF file
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);
  });

  test('should handle payment cancellation', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="payment-method-xendit"]');
    await page.click('button:has-text("Bayar Sekarang")');

    // Cancel payment
    await page.click('button:has-text("Batal")');

    // Should go back to pricing or dashboard
    await expect(page).toHaveURL(/\/(pricing|dashboard)/);
  });

  test('should show payment success notification', async ({ page }) => {
    // This would typically be tested with a webhook simulator
    // or by directly navigating to success page with valid transaction ID

    await page.goto('/payment/success?transaction_id=test123');

    // Should show success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('text=/pembayaran.*berhasil|payment.*successful/i')).toBeVisible();
  });

  test('should show payment failure notification', async ({ page }) => {
    await page.goto('/payment/failed?transaction_id=test123');

    // Should show failure message
    await expect(page.locator('[data-testid="payment-failed"]')).toBeVisible();
    await expect(page.locator('text=/pembayaran.*gagal|payment.*failed/i')).toBeVisible();

    // Should have retry button
    await expect(page.locator('button:has-text("Coba Lagi")')).toBeVisible();
  });

  test('should upgrade subscription', async ({ page }) => {
    // Assuming user has basic plan
    await page.goto('/dashboard/subscription');

    // Click upgrade
    await page.click('[data-testid="upgrade-btn"]');

    // Should go to pricing page
    await expect(page).toHaveURL(/\/pricing/);

    // Should highlight recommended plan
    await expect(page.locator('[data-testid="recommended-plan"]')).toBeVisible();
  });
});
