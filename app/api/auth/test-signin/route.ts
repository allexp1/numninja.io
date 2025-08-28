import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('Test signin attempt for:', email)

    // Create basic Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Supabase signin error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.status,
        errorDetails: error
      }, { status: 401 })
    }

    console.log('Signin successful, session:', !!data.session)
    console.log('User:', data.user?.email)

    // Return detailed response for debugging
    return NextResponse.json({
      success: true,
      hasSession: !!data.session,
      hasUser: !!data.user,
      userEmail: data.user?.email,
      sessionExpiry: data.session?.expires_at,
      accessTokenLength: data.session?.access_token?.length || 0,
      refreshTokenLength: data.session?.refresh_token?.length || 0
    })
  } catch (error: any) {
    console.error('Test signin error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  // Test endpoint to verify Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Try to get the current user (should be null if not signed in)
    const { data, error } = await supabase.auth.getUser()

    return NextResponse.json({
      supabaseConnected: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      getUserError: error?.message || null,
      currentUser: data?.user?.email || null
    })
  } catch (error: any) {
    return NextResponse.json({
      supabaseConnected: false,
      error: error.message
    }, { status: 500 })
  }
}