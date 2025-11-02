import { api } from '@/lib/api'

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
    expect(api.auth).toBeDefined()
    expect(api.auth.login).toBeDefined()
    expect(api.auth.register).toBeDefined()
    expect(api.auth.getProfile).toBeDefined()
  })

  it('should have tests methods', () => {
    expect(api.tests).toBeDefined()
    expect(api.tests.getAll).toBeDefined()
    expect(api.tests.create).toBeDefined()
  })

  it('should have results methods', () => {
    expect(api.results).toBeDefined()
    expect(api.results.getAll).toBeDefined()
  })

  it('should have admin methods', () => {
    expect(api.admin).toBeDefined()
    expect(api.admin.getStats).toBeDefined()
  })
})
