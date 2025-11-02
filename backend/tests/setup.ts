// Test setup file
// This runs before all tests

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

afterAll(() => {
  // Cleanup after all tests
});
