import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/my-numbers', '/checkout/success', '/admin']
  const isProtectedRoute = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isProtectedRoute && !session) {
    // Redirect to signin if not authenticated
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Protect admin routes specifically
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
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

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/my-numbers/:path*', '/checkout/success', '/admin/:path*']
}