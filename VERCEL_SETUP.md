# Vercel Production Setup Guide

## Required Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional)
```

### 2. Site URL (CRITICAL FOR AUTH)
```
NEXT_PUBLIC_SITE_URL=https://numninja-io.vercel.app
```

### 3. Stripe Configuration
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 4. DIDWW Configuration
```
DIDWW_API_KEY=your_didww_api_key
DIDWW_API_URL=https://api.didww.com/v3
```

## Supabase Configuration

### 1. Update Auth Settings in Supabase Dashboard

1. Go to Authentication > URL Configuration
2. Add to "Redirect URLs":
   - `https://numninja-io.vercel.app/auth/callback`
   - `https://numninja-io.vercel.app/auth/verify`
   - `https://numninja-io.vercel.app`

3. Update "Site URL" to: `https://numninja-io.vercel.app`

### 2. Email Templates

Update email templates to use the production URL:
- Confirmation email: Change URL to `https://numninja-io.vercel.app/auth/verify`
- Magic Link: Change URL to `https://numninja-io.vercel.app/auth/callback`

## Authentication Issues Fix

If authentication is not working:

1. **Clear browser cookies** for the domain
2. **Check Supabase Dashboard** for auth logs
3. **Verify environment variables** are set correctly
4. **Ensure middleware is deployed** - check Vercel Functions tab

## Testing Authentication

1. Sign up with a test email
2. Check email for verification link
3. Verify the link points to production URL
4. After verification, you should be redirected to dashboard

## Admin Access

To access admin panel:
1. Sign up with one of these emails:
   - `admin@numninja.io`
   - `alex.p@didww.com`
2. Verify email
3. Sign in
4. Navigate to `/admin`

## Troubleshooting

### Dashboard/Admin redirect loop:
- Clear cookies
- Check browser console for errors
- Verify Supabase session is valid

### Cart display issues:
- Hard refresh the page (Ctrl+Shift+R)
- Clear browser cache

### Authentication not persisting:
- Check NEXT_PUBLIC_SITE_URL is set correctly
- Verify Supabase redirect URLs include your domain
- Check middleware is running (Vercel Functions logs)

## Custom Domain Setup

1. In Vercel: Settings > Domains
2. Add `numninja.io`
3. Follow DNS configuration instructions
4. Update all environment variables to use new domain
5. Update Supabase redirect URLs to include new domain