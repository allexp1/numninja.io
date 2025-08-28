'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authStorage, isAdmin as checkIsAdmin } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  fallback = null 
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = authStorage.isAuthenticated()
        const adminStatus = checkIsAdmin()
        
        setIsAuthenticated(authenticated)
        setIsAdmin(adminStatus)

        // Redirect logic
        if (requireAuth && !authenticated) {
          router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
        } else if (requireAdmin && (!authenticated || !adminStatus)) {
          if (!authenticated) {
            router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
          } else {
            router.push('/dashboard')
          }
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (requireAuth) {
          router.push('/auth/signin')
        }
      }
    }

    checkAuth()

    // Check auth on focus (in case user logs in/out in another tab)
    const handleFocus = () => checkAuth()
    window.addEventListener('focus', handleFocus)

    // Check auth on storage change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'numninja_auth_token' || e.key === 'numninja_session') {
        checkAuth()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [requireAuth, requireAdmin, router, pathname])

  // Show loading state
  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Check authorization
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (requireAdmin && !isAdmin) {
    return null
  }

  return <>{children}</>
}

// HOC version for pages
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean
    requireAdmin?: boolean
  }
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard {...(options || {})}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}