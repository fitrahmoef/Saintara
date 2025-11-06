'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api, { setCsrfToken, fetchCsrfToken, startTokenRefreshTimer } from '../lib/api'

interface User {
  id: number
  email: string
  name: string
  nickname?: string
  role: string
  phone?: string
  gender?: string
  blood_type?: string
  country?: string
  city?: string
  avatar_url?: string
  created_at?: string
  institution_id?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in by fetching profile
    const checkAuth = async () => {
      try {
        // Try to get profile using httpOnly cookie
        const response = await api.get('/auth/profile')
        setUser(response.data.data.user)

        // Fetch CSRF token
        await fetchCsrfToken()

        // Start auto-refresh timer
        startTokenRefreshTimer()
      } catch (error) {
        // Not authenticated or token expired
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      const { user: userData, csrfToken } = response.data.data

      setUser(userData)

      // Store CSRF token (not sensitive, can be in localStorage)
      setCsrfToken(csrfToken)

      // Start auto-refresh timer
      startTokenRefreshTimer()

      // Redirect based on role
      if (userData.role === 'admin' || userData.role === 'superadmin' || userData.role === 'institution_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
      })

      const { user: userData, csrfToken } = response.data.data

      setUser(userData)

      // Store CSRF token (not sensitive, can be in localStorage)
      setCsrfToken(csrfToken)

      // Start auto-refresh timer
      startTokenRefreshTimer()

      // Redirect to user dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Register error:', error)
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh token
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user state regardless of API call result
      setUser(null)
      setCsrfToken('')

      // Redirect to home
      router.push('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
