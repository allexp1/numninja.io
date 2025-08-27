import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (!code) {
    return NextResponse.json(
      { error: 'No code provided' },
      { status: 400 }
    )
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?error=callback_error', request.url)
      )
    }

    // If this is a password reset callback, redirect to the password reset page
    if (next.includes('reset-password')) {
      return NextResponse.redirect(new URL(next, request.url))
    }

    // Otherwise, redirect to the home page or specified next URL
    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=callback_error', request.url)
    )
  }
}