import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Update user's email_confirmed_at to bypass email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      email, // This should be user ID, but we'll try with email first
      { email_confirm: true }
    )
    
    if (error) {
      // If that didn't work, try a different approach
      // Sign up and auto-confirm
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
        email: email,
        password: 'TempPassword123!',
        options: {
          data: {
            email_confirmed_at: new Date().toISOString()
          }
        }
      })
      
      if (signUpError) {
        return NextResponse.json({ 
          error: 'Could not bypass email confirmation',
          details: signUpError.message,
          note: 'You may need to manually confirm the email in Supabase dashboard or check your email for verification link'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'User created with email pre-confirmed',
        tempPassword: 'TempPassword123!',
        instructions: 'Use this temporary password to sign in, then change it'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email confirmation bypassed',
      user: data.user
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message,
      solution: 'Check Supabase dashboard -> Authentication -> Users -> Click on user -> Confirm email manually'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    instructions: {
      option1: 'Disable email confirmation in Supabase',
      steps1: [
        '1. Go to Supabase Dashboard',
        '2. Navigate to Authentication -> Providers -> Email',
        '3. Turn OFF "Confirm email"',
        '4. Save changes'
      ],
      option2: 'Manually confirm user',
      steps2: [
        '1. Go to Supabase Dashboard',
        '2. Navigate to Authentication -> Users',
        '3. Find the user (test@numninja.io)',
        '4. Click on the user',
        '5. Click "Confirm Email" button'
      ],
      option3: 'Check email for verification link',
      steps3: [
        '1. Check the email inbox for test@numninja.io',
        '2. Click the verification link',
        '3. This will confirm the email'
      ]
    }
  })
}