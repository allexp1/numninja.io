import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(
      new URL('/auth/signin?error=no_code', origin)
    )
  }

  try {
    const cookieStore = cookies()
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?error=invalid_code', origin)
      )
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(
        new URL('/auth/signin?error=no_session', origin)
      )
    }

    console.log('Session established for user:', data.session.user.email)

    // Create response with redirect
    const redirectUrl = next.includes('reset-password')
      ? new URL(next, origin)
      : new URL(next, origin)
    
    const response = NextResponse.redirect(redirectUrl)

    // Set auth cookies in the response
    const sessionCookies = [
      {
        name: 'sb-auth-token',
        value: data.session.access_token,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        },
      },
      {
        name: 'sb-refresh-token',
        value: data.session.refresh_token,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        },
      },
    ]

    // Set cookies in response
    sessionCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=server_error', origin)
    )
  }
}