'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { authStorage, isAdmin as checkIsAdmin } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load auth state from localStorage
  const loadAuthState = useCallback(() => {
    try {
      const session = authStorage.getSession()
      if (session && session.user) {
        setUser(session.user)
        setIsAuthenticated(true)
        setIsAdmin(checkIsAdmin())
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    loadAuthState()
  }, [loadAuthState])

  // Sign in function
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      // Call the API route
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Sign in failed' }
      }

      // Store tokens and user info in localStorage
      if (data.session && data.user) {
        authStorage.setTokens(
          {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          },
          data.user
        )
        
        setUser(data.user)
        setIsAuthenticated(true)
        setIsAdmin(checkIsAdmin())
        
        return { success: true }
      }

      return { success: false, error: 'No session created' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, metadata })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Sign up failed' }
      }

      // If email confirmation is required, just return success
      if (data.message && data.message.includes('confirm')) {
        return { success: true }
      }

      // If session is created (email confirmation disabled), store tokens
      if (data.session && data.user) {
        authStorage.setTokens(
          {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          },
          data.user
        )
        
        setUser(data.user)
        setIsAuthenticated(true)
        setIsAdmin(checkIsAdmin())
      }

      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      
      // Clear localStorage
      authStorage.clearTokens()
      
      // Call signout API to clear any server-side session
      await fetch('/api/auth/signout', {
        method: 'POST'
      })
      
      // Reset state
      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
      
      // Redirect to signin page
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh auth state
  const refreshAuth = () => {
    loadAuthState()
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin: boolean = false
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isAdmin, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
        } else if (requireAdmin && !isAdmin) {
          router.push('/dashboard')
        }
      }
    }, [isAuthenticated, isAdmin, loading, router, pathname])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated || (requireAdmin && !isAdmin)) {
      return null
    }

    return <Component {...props} />
  }
}