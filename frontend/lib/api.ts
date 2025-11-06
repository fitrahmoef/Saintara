import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance with cookie support
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enable cookies for httpOnly tokens
  headers: {
    'Content-Type': 'application/json',
  },
})

// CSRF Token management
let csrfToken: string | null = null

export const setCsrfToken = (token: string) => {
  csrfToken = token
}

export const getCsrfToken = () => csrfToken

// Fetch CSRF token from server
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/auth/csrf-token`, {
      withCredentials: true,
    })
    const token = response.data.data.csrfToken
    setCsrfToken(token)
    return token
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    throw error
  }
}

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token to state-changing requests
    if (
      csrfToken &&
      config.method &&
      ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())
    ) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    // SECURITY: Removed localStorage token fallback (XSS vulnerability)
    // Authentication now uses httpOnly cookies exclusively

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Try to refresh the access token
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        processQueue()
        isRefreshing = false
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        isRefreshing = false

        // SECURITY: No need to clear localStorage (using httpOnly cookies only)

        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Auto-refresh token before expiry
 * Access token expires in 15 minutes, refresh at 14 minutes
 */
export const startTokenRefreshTimer = () => {
  const REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes

  setInterval(async () => {
    try {
      await api.post('/auth/refresh')
      console.log('[Token Refresh] Access token refreshed successfully')
    } catch (error) {
      console.error('[Token Refresh] Failed to refresh token:', error)
    }
  }, REFRESH_INTERVAL)
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: { name?: string; phone?: string; avatar_url?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/change-password', { current_password, new_password }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
}

// Test API
export const testAPI = {
  getQuestions: () => api.get('/tests/questions'),
  getMyTests: () => api.get('/tests/my-tests'),
  createTest: (testType = 'personal') => api.post('/tests', { test_type: testType }),
  submitTest: (id: number, answers: any[]) =>
    api.post(`/tests/${id}/submit`, { answers }),
}

// Attach to api object for backward compatibility
;(api as any).tests = testAPI

// Result API
export const resultAPI = {
  getUserResults: () => api.get('/results'),
  getLatestResult: () => api.get('/results/latest'),
  getResult: (id: number) => api.get(`/results/${id}`),
  downloadPDF: (id: number) => api.get(`/results/${id}/pdf`, { responseType: 'blob' }),
}

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (page = 1, limit = 20, search = '') =>
    api.get('/admin/users', { params: { page, limit, search } }),
  getUserDetails: (id: number) => api.get(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
}

// Transaction API
export const transactionAPI = {
  create: (package_type: string, amount: number, payment_method: string) =>
    api.post('/transactions', { package_type, amount, payment_method }),

  getUserTransactions: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/transactions', { params }),

  getById: (id: number) => api.get(`/transactions/${id}`),

  uploadPaymentProof: (id: number, payment_proof_url: string) =>
    api.put(`/transactions/${id}/payment-proof`, { payment_proof_url }),

  // Admin
  getAll: (params?: { status?: string; limit?: number; offset?: number; search?: string }) =>
    api.get('/transactions/admin/all', { params }),

  updateStatus: (id: number, status: string) =>
    api.put(`/transactions/${id}/status`, { status }),

  getStats: () => api.get('/transactions/stats'),
}

// Voucher API
export const voucherAPI = {
  getUserVouchers: (is_used?: boolean) =>
    api.get('/vouchers', { params: { is_used } }),

  useVoucher: (code: string) =>
    api.post('/vouchers/use', { code }),

  // Admin
  create: (user_id: number, package_type: string, expires_at: string) =>
    api.post('/vouchers/create', { user_id, package_type, expires_at }),

  getAll: (params?: { is_used?: boolean; limit?: number; offset?: number }) =>
    api.get('/vouchers/admin/all', { params }),

  delete: (id: number) => api.delete(`/vouchers/${id}`),
}

// Agent API
export const agentAPI = {
  getAll: (params?: { status?: string; limit?: number; offset?: number; search?: string }) =>
    api.get('/agents', { params }),

  create: (user_id: number, commission_rate?: number) =>
    api.post('/agents', { user_id, commission_rate }),

  getById: (id: number) => api.get(`/agents/${id}`),

  getStats: (id: number) => api.get(`/agents/${id}/stats`),

  updateStatus: (id: number, data: { status?: string; commission_rate?: number }) =>
    api.put(`/agents/${id}/status`, data),

  recordSale: (agent_code: string, transaction_id: number) =>
    api.post('/agents/sales', { agent_code, transaction_id }),

  payCommission: (id: number) =>
    api.put(`/agents/sales/${id}/pay`, {}),
}

// Event API
export const eventAPI = {
  getAll: (params?: { status?: string; event_type?: string; limit?: number; offset?: number }) =>
    api.get('/events', { params }),

  getById: (id: number) => api.get(`/events/${id}`),

  getMyRegistrations: () => api.get('/events/my-registrations'),

  register: (id: number) => api.post(`/events/${id}/register`, {}),

  cancel: (id: number) => api.put(`/events/${id}/cancel`, {}),

  // Admin
  create: (data: any) => api.post('/events/create', data),

  update: (id: number, data: any) => api.put(`/events/${id}`, data),

  delete: (id: number) => api.delete(`/events/${id}`),

  markAttendance: (event_id: number, user_id: number) =>
    api.post('/events/attendance', { event_id, user_id }),
}

// Approval API
export const approvalAPI = {
  getMyApprovals: () => api.get('/approvals/my-approvals'),

  create: (type: string, reference_id?: number, notes?: string) =>
    api.post('/approvals', { type, reference_id, notes }),

  delete: (id: number) => api.delete(`/approvals/${id}`),

  // Admin
  getAll: (params?: { type?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/approvals', { params }),

  getById: (id: number) => api.get(`/approvals/${id}`),

  updateStatus: (id: number, status: string, notes?: string) =>
    api.put(`/approvals/${id}/status`, { status, notes }),

  getPendingCount: () => api.get('/approvals/pending-count'),
}

// Article API
export const articleAPI = {
  getAll: (params?: { category?: string; is_published?: boolean; limit?: number; offset?: number; search?: string }) =>
    api.get('/articles', { params }),

  getById: (id: number) => api.get(`/articles/${id}`),

  getFeatured: (limit = 5) => api.get('/articles/featured', { params: { limit } }),

  getByCategory: (category: string, limit = 10, offset = 0) =>
    api.get(`/articles/category/${category}`, { params: { limit, offset } }),

  // Admin
  create: (data: { title: string; content: string; category?: string; featured_image?: string; is_published?: boolean }) =>
    api.post('/articles', data),

  update: (id: number, data: any) =>
    api.put(`/articles/${id}`, data),

  delete: (id: number) => api.delete(`/articles/${id}`),
}

// Institution API
export const institutionAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; is_active?: boolean }) =>
    api.get('/institutions', { params }),

  getById: (id: number) => api.get(`/institutions/${id}`),

  create: (data: {
    name: string
    code: string
    contact_email?: string
    contact_phone?: string
    address?: string
    max_users: number
    subscription_type: string
  }) => api.post('/institutions', data),

  update: (id: number, data: any) =>
    api.put(`/institutions/${id}`, data),

  delete: (id: number) => api.delete(`/institutions/${id}`),

  getStatistics: (id: number) => api.get(`/institutions/${id}/statistics`),

  getAnalytics: (id: number, params?: { start_date?: string; end_date?: string }) =>
    api.get(`/institutions/${id}/analytics`, { params }),

  // Admin management
  getAdmins: (id: number) => api.get(`/institutions/${id}/admins`),

  assignAdmin: (id: number, user_id: number, role: string) =>
    api.post(`/institutions/${id}/admins`, { user_id, role }),

  removeAdmin: (institutionId: number, adminId: number) =>
    api.delete(`/institutions/${institutionId}/admins/${adminId}`),
}

// Customer API
export const customerAPI = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    institution_id?: number
    tag_id?: number
    status?: string
    sort_by?: string
    sort_order?: string
  }) => api.get('/customers', { params }),

  getById: (id: number) => api.get(`/customers/${id}`),

  create: (data: {
    email: string
    name: string
    password: string
    phone?: string
    gender?: string
    blood_type?: string
    country?: string
    city?: string
    nickname?: string
    institution_id?: number
    tag_ids?: number[]
  }) => api.post('/customers', data),

  update: (id: number, data: any) =>
    api.put(`/customers/${id}`, data),

  delete: (id: number) => api.delete(`/customers/${id}`),

  // Bulk operations
  downloadTemplate: () =>
    api.get('/customers/bulk/template', { responseType: 'blob' }),

  bulkImport: (formData: FormData) =>
    api.post('/customers/bulk/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getImportHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/customers/bulk/history', { params }),
}

// Export all API modules
export { api as default, api }
export const tests = testAPI
export const auth = authAPI
export const results = resultAPI
export const admin = adminAPI
export const transactions = transactionAPI
export const vouchers = voucherAPI
export const agents = agentAPI
export const events = eventAPI
export const approvals = approvalAPI
export const articles = articleAPI
export const institutions = institutionAPI
export const customers = customerAPI
