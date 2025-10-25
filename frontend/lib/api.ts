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

// User API
export const userAPI = {
  getTests: () => api.get('/users/tests'),
  getResults: () => api.get('/users/results'),
}

// Test API
export const testAPI = {
  getAllTests: () => api.get('/tests'),
  getTest: (id: number) => api.get(`/tests/${id}`),
  submitTest: (id: number, answers: any[]) =>
    api.post(`/tests/${id}/submit`, { answers }),
}

// Result API
export const resultAPI = {
  getAllResults: () => api.get('/results'),
  getResult: (id: number) => api.get(`/results/${id}`),
  downloadPDF: (id: number) => api.get(`/results/${id}/pdf`, { responseType: 'blob' }),
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
}

export default api
