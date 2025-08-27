import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Clear all Supabase-related cookies
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') || 
          cookie.name.includes('supabase') ||
          cookie.value.startsWith('base64-') ||
          cookie.value.startsWith('eyJ')) {
        console.log(`Clearing cookie: ${cookie.name}`)
        cookieStore.delete(cookie.name)
      }
    }
    
    return NextResponse.json({ 
      message: 'Cookies cleared successfully',
      clearedCount: allCookies.filter(c => 
        c.name.startsWith('sb-') || 
        c.name.includes('supabase') ||
        c.value.startsWith('base64-') ||
        c.value.startsWith('eyJ')
      ).length
    })
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json({ error: 'Failed to clear cookies' }, { status: 500 })
  }
}