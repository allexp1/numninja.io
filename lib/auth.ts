import { User, Session } from '@supabase/supabase-js'

// Constants for localStorage keys
const AUTH_TOKEN_KEY = 'numninja_auth_token'
const REFRESH_TOKEN_KEY = 'numninja_refresh_token'
const USER_KEY = 'numninja_user'
const SESSION_KEY = 'numninja_session'

// Type definitions
interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at?: number
}

interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: User
}

// Token management functions
export const authStorage = {
  // Store tokens and user info
  setTokens: (tokens: AuthTokens, user?: User) => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, tokens.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
      
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      }
      
      // Store complete session
      const session: StoredSession = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        user: user || JSON.parse(localStorage.getItem(USER_KEY) || '{}')
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      
      return true
    } catch (error) {
      console.error('Error storing auth tokens:', error)
      return false
    }
  },

  // Get access token
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
      return null
    }
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  },

  // Get user info
  getUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  // Get complete session
  getSession: (): StoredSession | null => {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY)
      if (!sessionStr) return null
      
      const session = JSON.parse(sessionStr)
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        // Session expired, clear it
        authStorage.clearTokens()
        return null
      }
      
      return session
    } catch {
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authStorage.getAccessToken()
    const session = authStorage.getSession()
    return !!(token && session && session.user)
  },

  // Clear all auth data
  clearTokens: () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(SESSION_KEY)
      return true
    } catch (error) {
      console.error('Error clearing auth tokens:', error)
      return false
    }
  },

  // Update user info
  updateUser: (user: User) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      
      // Update session with new user info
      const session = authStorage.getSession()
      if (session) {
        session.user = user
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      }
      
      return true
    } catch (error) {
      console.error('Error updating user:', error)
      return false
    }
  }
}

// Helper function to add auth header to fetch requests
export const getAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const token = authStorage.getAccessToken()
  
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
  
  return {
    ...headers,
    'Content-Type': 'application/json'
  }
}

// Authenticated fetch wrapper
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const authHeaders = getAuthHeaders(options.headers)
  
  const response = await fetch(url, {
    ...options,
    headers: authHeaders
  })
  
  // If unauthorized, clear tokens and redirect to signin
  if (response.status === 401) {
    authStorage.clearTokens()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin'
    }
  }
  
  return response
}

// Check if user is admin
export const isAdmin = (): boolean => {
  const user = authStorage.getUser()
  if (!user?.email) return false
  
  const adminEmails = ['admin@test.com', 'admin@numninja.io', 'alex.p@didww.com']
  return adminEmails.includes(user.email) || user.email.endsWith('@numninja.io')
}