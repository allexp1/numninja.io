import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { validateEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create Supabase client with proper cookie handling
    const supabase = createRouteHandlerClient({ cookies })

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session created' },
        { status: 401 }
      )
    }

    console.log('User signed in successfully:', email)
    console.log('Session created:', !!data.session.access_token)

    // The auth-helpers should handle cookies, but let's ensure we're returning them
    const response = NextResponse.json(
      {
        message: 'Sign in successful',
        user: data.user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      },
      { status: 200 }
    )

    // Get the cookies that were set by supabase
    const cookieStore = cookies()
    const supabaseCookies = cookieStore.getAll().filter(c =>
      c.name.startsWith('sb-') || c.name.includes('supabase')
    )
    
    console.log('Cookies after signin:', supabaseCookies.map(c => c.name))

    return response
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}