import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  getProfile: () => api.get('/auth/profile'),
}

// Test API
export const testAPI = {
  getQuestions: () => api.get('/tests/questions'),
  getMyTests: () => api.get('/tests/my-tests'),
  createTest: (testType = 'personal') => api.post('/tests', { test_type: testType }),
  submitTest: (id: number, answers: any[]) =>
    api.post(`/tests/${id}/submit`, { answers }),
}

// Result API
export const resultAPI = {
  getUserResults: () => api.get('/results'),
  getLatestResult: () => api.get('/results/latest'),
  getResult: (id: number) => api.get(`/results/${id}`),
}

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (page = 1, limit = 20, search = '') =>
    api.get('/admin/users', { params: { page, limit, search } }),
  getUserDetails: (id: number) => api.get(`/admin/users/${id}`),
}

export default api
