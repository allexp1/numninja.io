import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    console.log('Clearing malformed cookies...')
    
    // Clear only truly malformed cookies, not valid auth tokens
    for (const cookie of allCookies) {
      // Only clear cookies that have the base64- prefix error
      // Don't clear valid Supabase auth tokens or chunked cookies
      if (cookie.value.startsWith('base64-')) {
        console.log(`Clearing malformed cookie: ${cookie.name}`)
        cookieStore.delete(cookie.name)
      }
    }
    
    // Redirect to signin page after clearing cookies
    return NextResponse.redirect(new URL('/auth/signin?cleared=true', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=clear_failed', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  }
}