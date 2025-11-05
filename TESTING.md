# Testing Guide for Saintara

This document provides information about testing in the Saintara project.

## Overview

We use **Jest** as our testing framework for both backend and frontend code. Our goal is to maintain at least **60% test coverage** across the codebase.

## Test Structure

### Backend Tests

Location: `/backend/tests/`

#### Test Files

- `auth.test.ts` - Authentication and authorization tests
- `health.test.ts` - Health check endpoint tests
- `customer.controller.test.ts` - Customer management tests (NEW)
- `email.service.test.ts` - Email service tests (NEW)
- `upload.controller.test.ts` - File upload tests (NEW)

### Frontend Tests

Location: `/frontend/__tests__/`

#### Test Files

- `api.test.ts` - API client tests
- `Footer.test.tsx` - Footer component tests
- `Navbar.test.tsx` - Navbar component tests

## Running Tests

### Backend

```bash
cd backend
npm test                  # Run all tests
npm test -- --coverage    # Run with coverage report
npm test -- --watch       # Run in watch mode
npm test auth             # Run specific test file
```

### Frontend

```bash
cd frontend
npm test                  # Run all tests
npm test -- --coverage    # Run with coverage report
npm test -- --watch       # Run in watch mode
```

## Test Coverage Goals

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| Customer Management | 85% | 90% | High |
| Email Service | 75% | 85% | High |
| File Uploads | 80% | 90% | High |
| Authentication | 60% | 80% | Medium |
| Frontend Components | 30% | 70% | High |
| API Integration | 40% | 70% | Medium |

## Writing Tests

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names for test cases
   ```typescript
   it('should return 404 for non-existent customer', async () => {
     // ...
   });
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should create a new customer', async () => {
     // Arrange
     const newCustomer = { email: 'test@example.com', name: 'Test' };

     // Act
     const response = await request(app).post('/customers').send(newCustomer);

     // Assert
     expect(response.status).toBe(201);
     expect(response.body.data.customer.email).toBe(newCustomer.email);
   });
   ```

3. **Mock External Dependencies**: Always mock database, email service, and external APIs
   ```typescript
   jest.mock('../src/config/database');
   jest.mock('../src/services/email.service');
   ```

4. **Test Error Cases**: Don't just test happy paths
   ```typescript
   it('should handle database errors gracefully', async () => {
     mockPool.query.mockRejectedValueOnce(new Error('Database error'));
     const response = await request(app).get('/customers');
     expect(response.status).toBe(500);
   });
   ```

5. **Clean Up After Tests**:
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

## Test Examples

### Testing Controllers

```typescript
describe('Customer Controller', () => {
  it('should return paginated customers', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: mockCustomers });

    const response = await request(app).get('/customers');

    expect(response.status).toBe(200);
    expect(response.body.data.customers).toHaveLength(2);
  });
});
```

### Testing Services

```typescript
describe('EmailService', () => {
  it('should render template with variables', () => {
    const template = 'Hello {{name}}!';
    const data = { name: 'John' };

    const result = emailService.renderTemplate(template, data);

    expect(result).toBe('Hello John!');
  });
});
```

### Testing React Components

```typescript
describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests are automatically run on:
- Every pull request
- Every push to main branch
- Before deployment

## Code Coverage Reports

After running tests with coverage, view the report:

```bash
# Backend
cd backend
open coverage/lcov-report/index.html

# Frontend
cd frontend
open coverage/lcov-report/index.html
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- customer.controller.test.ts
```

### Run Specific Test Case

```bash
npm test -- -t "should create a new customer"
```

### Enable Debug Mode

```bash
NODE_ENV=test DEBUG=* npm test
```

## Testing Checklist

When adding new features, ensure you:

- [ ] Write unit tests for new functions/methods
- [ ] Write integration tests for API endpoints
- [ ] Write component tests for React components
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Mock external dependencies
- [ ] Achieve at least 80% coverage for new code
- [ ] Update this documentation if needed

## Common Issues

### Issue: Tests timeout
**Solution**: Increase Jest timeout in jest.config.js
```javascript
module.exports = {
  testTimeout: 10000, // 10 seconds
};
```

### Issue: Database connection errors
**Solution**: Ensure database mocks are properly configured
```typescript
jest.mock('../src/config/database');
```

### Issue: File upload tests fail
**Solution**: Mock the file system operations
```typescript
jest.mock('fs/promises');
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)

## Contact

If you have questions about testing, please:
- Check existing tests for examples
- Review this documentation
- Ask in the team chat
- Create an issue on GitHub
