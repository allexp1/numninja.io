import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Check what cookies are present
    const authCookies = allCookies.filter(c => 
      c.name.startsWith('sb-') || 
      c.name.includes('supabase')
    )
    
    // Try to get session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return NextResponse.json({
      debug: {
        hasSession: !!session,
        sessionUser: session?.user?.email || null,
        sessionError: error?.message || null,
        authCookiesPresent: authCookies.map(c => ({
          name: c.name,
          valueLength: c.value.length,
          valueStart: c.value.substring(0, 20)
        })),
        allCookiesCount: allCookies.length,
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
          NODE_ENV: process.env.NODE_ENV
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}