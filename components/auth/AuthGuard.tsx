'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

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
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (requireAuth && !session) {
          // Not authenticated - redirect to signin
          router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
          return
        }
        
        if (requireAdmin && session) {
          // Check admin status
          const adminEmails = ['admin@test.com', 'admin@numninja.io']
          const isAdmin = adminEmails.includes(session.user.email || '')
          
          if (!isAdmin) {
            router.push('/dashboard')
            return
          }
        }
        
        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        if (requireAuth) {
          router.push('/auth/signin')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        checkAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [requireAuth, requireAdmin, router, pathname])

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
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