import { createClient } from '@supabase/supabase-js'
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

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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
    console.log('Session created, manually setting cookies...')

    // Create response
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

    // Get project reference from Supabase URL
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    const projectRef = supabaseUrl.hostname.split('.')[0]
    
    // Create cookie value as JSON (Supabase format)
    const cookieValue = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      provider_token: null,
      provider_refresh_token: null,
      user: {
        id: data.user.id,
        email: data.user.email,
        app_metadata: data.user.app_metadata,
        user_metadata: data.user.user_metadata,
        aud: data.user.aud,
        created_at: data.user.created_at
      }
    }
    
    // Set the combined session cookie (how Supabase auth-helpers expects it)
    const cookieName = `sb-${projectRef}-auth-token`
    
    // Encode as base64 (Supabase format)
    const encodedValue = Buffer.from(JSON.stringify(cookieValue)).toString('base64')
    
    // Set cookie with proper options
    response.cookies.set(cookieName, encodedValue, {
      httpOnly: false, // Must be false for client-side to read
      secure: true, // Always use secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.vercel.app' // Allow cookie on all subdomains
    })
    
    // Also set a simpler cookie for middleware to check
    response.cookies.set('auth-session', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: '.vercel.app'
    })

    console.log(`Cookies set: ${cookieName} and auth-session`)

    return response
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}