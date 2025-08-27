import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to signin if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Check if user is admin
    // For now, check if email ends with @numninja.io or is a specific admin email
    const isAdmin = user.email?.endsWith('@numninja.io') || 
                   user.email === 'admin@example.com'

    if (!isAdmin) {
      // Redirect to home if not an admin
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*']
}