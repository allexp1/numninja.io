import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create Supabase admin client using service role key if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create a test user
    const testEmail = 'test@numninja.io'
    const testPassword = 'TestPassword123!'
    
    console.log('Creating test user:', testEmail)
    
    // First try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })
    
    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('Signup error:', signUpError)
      return NextResponse.json({
        error: 'Failed to create test user',
        details: signUpError.message
      }, { status: 400 })
    }
    
    // Try to sign in with the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInError) {
      return NextResponse.json({
        message: 'Test user may need email verification',
        email: testEmail,
        password: testPassword,
        signInError: signInError.message,
        instructions: 'Please verify the email or try signing in with these credentials'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test user created/verified successfully',
      credentials: {
        email: testEmail,
        password: testPassword
      },
      hasSession: !!signInData.session,
      sessionInfo: {
        userId: signInData.user?.id,
        userEmail: signInData.user?.email,
        emailConfirmed: signInData.user?.email_confirmed_at ? true : false
      }
    })
    
  } catch (error: any) {
    console.error('Create test user error:', error)
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 })
  }
}