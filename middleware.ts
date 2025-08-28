import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  let session = null
  
  // Wrap the entire auth check in try-catch to handle cookie parsing errors
  try {
    // Check for cookies that might cause parsing errors
    const cookies = req.cookies.getAll()
    const hasProblematicCookies = cookies.some(cookie =>
      cookie.value.startsWith('base64-') ||
      (cookie.value.startsWith('eyJ') && !cookie.name.match(/\.\d+$/))
    )
    
    if (hasProblematicCookies) {
      console.log('Found problematic cookies, clearing and redirecting')
      const response = NextResponse.redirect(new URL('/auth/signin?cleared=true', req.url))
      
      // Clear ALL auth-related cookies to start fresh
      cookies.forEach(cookie => {
        if (cookie.name.startsWith('sb-') ||
            cookie.name.includes('supabase') ||
            cookie.value.startsWith('base64-') ||
            cookie.value.startsWith('eyJ')) {
          response.cookies.delete(cookie.name)
        }
      })
      
      return response
    }
    
    const supabase = createMiddlewareClient({ req, res })

    // Refresh the session to ensure it's valid
    const {
      data,
      error
    } = await supabase.auth.getSession()
    
    session = data.session

    // Log for debugging (also in production temporarily to debug issues)
    console.log('Middleware path:', req.nextUrl.pathname)
    console.log('Session exists:', !!session)
    console.log('Session user:', session?.user?.email)
    if (error) {
      console.error('Session error:', error)
    }
  } catch (parseError: any) {
    console.error('Auth middleware error:', parseError.message)
    
    // If there's any error (including cookie parsing), clear cookies and redirect
    const response = NextResponse.redirect(new URL('/auth/signin?error=session', req.url))
    
    // Clear ALL cookies to ensure clean state
    const allCookies = req.cookies.getAll()
    allCookies.forEach(cookie => {
      response.cookies.delete(cookie.name)
    })
    
    return response
  }

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/my-numbers', '/checkout/success', '/admin']
  const isProtectedRoute = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')

  // If it's a protected route and no session, redirect to signin
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/signin', req.url)
    // Only set redirectTo if not already on an auth page
    if (!isAuthRoute) {
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Protect admin routes specifically
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session?.user) {
      const redirectUrl = new URL('/auth/signin', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin
    // Admin emails: admin@numninja.io or alex.p@didww.com (for testing)
    const adminEmails = ['admin@numninja.io', 'alex.p@didww.com']
    const isAdmin = session.user.email && (
      adminEmails.includes(session.user.email) ||
      session.user.email.endsWith('@numninja.io')
    )

    if (!isAdmin) {
      // Redirect to dashboard if not an admin
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // IMPORTANT: Must return res with refreshed auth headers
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/my-numbers/:path*',
    '/checkout/success',
    '/admin/:path*'
  ]
}