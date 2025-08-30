# Authentication Fix - Complete Solution

## The Problem
You're getting kicked out because there are TWO conflicting auth systems:
1. Old localStorage-based auth (`lib/auth.ts`)
2. Supabase cookie-based auth (`lib/supabase-auth.ts`)

## Immediate Fix (Do This Now)

### Step 1: Clear Browser Data
```javascript
// Run this in browser console
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Step 2: Test Authentication
1. Go to http://localhost:3000/auth/signin
2. Sign in with:
   - Email: `admin@test.com`
   - Password: `Test123456`
3. You should be redirected to dashboard
4. Navigate to http://localhost:3000/my-numbers
5. If you get kicked out, continue to Step 3

### Step 3: Apply This Critical Fix

Replace the entire `components/auth/AuthGuard.tsx` with this simplified version:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  fallback = null 
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (requireAuth && !session) {
          // Not authenticated - redirect to signin
          router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
          return
        }
        
        if (requireAdmin && session) {
          // Check admin status
          const adminEmails = ['admin@test.com', 'admin@numninja.io']
          const isAdmin = adminEmails.includes(session.user.email || '')
          
          if (!isAdmin) {
            router.push('/dashboard')
            return
          }
        }
        
        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        if (requireAuth) {
          router.push('/auth/signin')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        checkAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [requireAuth, requireAdmin, router, pathname])

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
```

### Step 4: Remove Old Auth System

Delete or rename this file:
- `lib/auth.ts` → `lib/auth.old.ts`

### Step 5: Fix API Routes

Update ALL API routes to use cookie-based auth. Example:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore
  })

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your API logic here
}
```

## Testing After Fix

1. Clear all browser data (Step 1)
2. Sign in at `/auth/signin`
3. Navigate to `/dashboard` - should work
4. Navigate to `/my-numbers` - should work
5. Navigate to `/cart` → checkout flow - should work
6. Return from Stripe - should maintain session

## Why This Works

1. **Single Auth System**: Only Supabase cookies, no localStorage conflicts
2. **Proper Session Handling**: Middleware refreshes sessions automatically
3. **Consistent API Auth**: All routes use the same auth method
4. **No Race Conditions**: Simplified AuthGuard with proper cleanup

## Environment Variables Required

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://qzcjbmsrroolbkxodgbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## If Still Having Issues

1. **Check Browser Console**: Look for any errors
2. **Check Network Tab**: Look for 401 responses
3. **Check Cookies**: Should see `sb-` prefixed cookies
4. **Restart Dev Server**: `npm run dev`

## Final Test Checklist

- [ ] Can sign in
- [ ] Dashboard loads without redirect
- [ ] My Numbers page works
- [ ] Cart → Checkout → Success flow works
- [ ] Session persists after navigation
- [ ] Session persists after page refresh
- [ ] API calls work (check Network tab)

The authentication should now work properly without kicking you out!