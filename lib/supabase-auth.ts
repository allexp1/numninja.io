import { supabase } from './supabase-client'

// Use the shared Supabase client for auth operations
export const supabaseAuth = supabase

// Get current session from Supabase (not localStorage)
export async function getCurrentSession() {
  const { data: { session }, error } = await supabaseAuth.auth.getSession()
  
  if (error) {
    return null
  }
  
  return session
}

// Get current user from Supabase
export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user || null
}

// Check if user is authenticated
export async function isAuthenticated() {
  const session = await getCurrentSession()
  return !!session?.user
}

// Sign out user
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  if (error) {
    return false
  }
  return true
}

// Authenticated fetch - cookies are automatically sent
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const session = await getCurrentSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Ensure cookies are sent
  })
  
  if (response.status === 401) {
    // Clear session and redirect to signin
    await signOut()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin'
    }
  }
  
  return response
}

// Check if user is admin (based on email)
export async function isAdmin() {
  const user = await getCurrentUser()
  if (!user?.email) return false
  
  const adminEmails = ['admin@test.com', 'admin@numninja.io', 'alex.p@didww.com']
  return adminEmails.includes(user.email) || user.email.endsWith('@numninja.io')
}