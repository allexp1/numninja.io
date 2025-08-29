import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a single instance of the Supabase client
// This prevents multiple GoTrueClient instances and session conflicts
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}

// Export the singleton instance
export const supabase = getSupabaseClient()