# NumNinja Admin Access

## Admin Panel Access

The admin panel is available at `/admin` and is protected by authentication middleware.

### Admin Email Addresses

The following email addresses have admin access:
- `admin@numninja.io`
- `alex.p@didww.com`
- Any email ending with `@numninja.io`

### How to Access Admin Panel

1. Sign up with one of the admin email addresses
2. Verify your email
3. Sign in
4. Navigate to `/admin`

### Admin Features

The admin panel includes:
- User management
- Order management
- Country and area code pricing management
- Forwarding configuration
- System statistics

### Default Admin Setup

For development and testing:
1. Sign up with `alex.p@didww.com` 
2. Use a strong password (min 10 chars, uppercase, lowercase, numbers, special chars)
3. Verify email
4. Access admin panel at `/admin`

### Production Setup

For production, you should:
1. Create a dedicated admin@numninja.io email address
2. Use a very strong password
3. Consider implementing 2FA (not yet implemented)
4. Regularly rotate admin credentials

### Security Notes

- Admin access is controlled in `middleware.ts`
- All admin routes require authentication
- Non-admin users are redirected to dashboard
- Session-based authentication via Supabase