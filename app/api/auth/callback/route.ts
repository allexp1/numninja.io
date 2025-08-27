import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(
      new URL('/auth/signin?error=no_code', requestUrl.origin)
    )
  }

  try {
    // Create Supabase client using auth-helpers for proper cookie handling
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?error=invalid_code', requestUrl.origin)
      )
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(
        new URL('/auth/signin?error=no_session', requestUrl.origin)
      )
    }

    console.log('Session established for user:', data.session.user.email)

    // Redirect to the appropriate page
    const redirectUrl = next.includes('reset-password')
      ? new URL(next, requestUrl.origin)
      : new URL(next, requestUrl.origin)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=server_error', requestUrl.origin)
    )
  }
}