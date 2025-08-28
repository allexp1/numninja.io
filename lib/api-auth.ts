import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Extract token from Authorization header
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Verify token and get user
export async function verifyToken(token: string) {
  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Token verification error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Middleware for protected API routes
export async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  
  if (!token) {
    return {
      authenticated: false,
      user: null,
      error: 'No authentication token provided'
    }
  }
  
  const user = await verifyToken(token)
  
  if (!user) {
    return {
      authenticated: false,
      user: null,
      error: 'Invalid or expired token'
    }
  }
  
  return {
    authenticated: true,
    user,
    error: null
  }
}

// Check if user is admin
export function isUserAdmin(email: string | undefined): boolean {
  if (!email) return false
  
  const adminEmails = ['admin@test.com', 'admin@numninja.io', 'alex.p@didww.com']
  return adminEmails.includes(email) || email.endsWith('@numninja.io')
}

// Protected route handler wrapper
export function withAuth(
  handler: (request: NextRequest, context: { user: any }) => Promise<Response>,
  options?: { requireAdmin?: boolean }
) {
  return async (request: NextRequest) => {
    const { authenticated, user, error } = await authenticateRequest(request)
    
    if (!authenticated || !user) {
      return new Response(
        JSON.stringify({ error: error || 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (options?.requireAdmin && !isUserAdmin(user?.email)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return handler(request, { user })
  }
}