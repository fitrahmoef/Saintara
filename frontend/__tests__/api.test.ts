import { authAPI, testAPI, resultAPI, adminAPI } from '@/lib/api'

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('API Client', () => {
  it('should have auth methods', () => {
    expect(authAPI).toBeDefined()
    expect(authAPI.login).toBeDefined()
    expect(authAPI.register).toBeDefined()
    expect(authAPI.getProfile).toBeDefined()
  })

  it('should have tests methods', () => {
    expect(testAPI).toBeDefined()
    expect(testAPI.getQuestions).toBeDefined()
    expect(testAPI.createTest).toBeDefined()
  })

  it('should have results methods', () => {
    expect(resultAPI).toBeDefined()
    expect(resultAPI.getUserResults).toBeDefined()
  })

  it('should have admin methods', () => {
    expect(adminAPI).toBeDefined()
    expect(adminAPI.getStats).toBeDefined()
  })
})
