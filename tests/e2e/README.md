# E2E Testing with Playwright

## Overview
End-to-end tests for critical user flows in Saintara platform.

## Test Coverage
- **Authentication**: Registration, login, logout, password reset
- **Test Taking**: Complete test journey from start to results
- **Payment**: Checkout flow, payment processing, transaction history

## Running Tests

### Install Dependencies
```bash
npm install -D @playwright/test
npx playwright install
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## View Reports

### HTML Report
```bash
npx playwright show-report
```

### Traces (for debugging)
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are configured to run in GitHub Actions. See `.github/workflows/e2e-tests.yml`

## Writing New Tests

1. Create test file in `tests/e2e/`
2. Use helpers from `tests/e2e/helpers/`
3. Follow naming convention: `feature.spec.ts`
4. Add data-testid attributes to UI elements for stable selectors

## Best Practices

- Use `data-testid` for element selection
- Keep tests independent (no dependencies between tests)
- Use test fixtures for common setup
- Clean up test data after tests
- Use page object pattern for complex pages

## Test Data

Test users are generated dynamically. For specific test scenarios, use:
- Admin user: `admin@saintara.com` / `admin123`
- Test user: Generated via `generateTestUser()`

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running

### Element not found
- Verify `data-testid` attributes exist
- Use Playwright Inspector: `npx playwright test --debug`

### Flaky tests
- Add explicit waits: `await page.waitForSelector()`
- Use `waitForLoadState()` after navigation
