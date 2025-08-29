'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentSession, isAdmin as checkIsAdmin } from '@/lib/supabase-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session from Supabase
        const session = await getCurrentSession()
        const authenticated = !!session?.user
        const adminStatus = authenticated ? await checkIsAdmin() : false
        
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
        if (requireAuth) {
          router.push('/auth/signin')
        }
        setIsChecking(false)
      }
    }

    checkAuth()

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [requireAuth, requireAdmin, router, pathname, supabase])

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