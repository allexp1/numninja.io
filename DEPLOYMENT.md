# NumNinja Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase project created
- Stripe account with production access
- DIDWW account with API credentials
- Resend account for email notifications
- Domain name configured with DNS provider
- Vercel/Netlify account (or preferred hosting platform)

## 1. Database Setup

### Supabase Configuration

1. Create a new Supabase project at https://app.supabase.com
2. Run the migration scripts in order:

```bash
# From Supabase Dashboard SQL Editor
-- Run 001_initial_schema.sql first
-- Then run 002_rls_policies.sql
```

3. Configure Authentication:
   - Enable Email/Password authentication
   - Set up email templates
   - Configure redirect URLs for your domain

### Environment Variables

Copy `.env.production.example` to `.env.production` and fill in your values:

```bash
cp .env.production.example .env.production
```

## 2. Stripe Configuration

### Production Setup

1. Get your production API keys from https://dashboard.stripe.com/apikeys
2. Create webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copy the webhook signing secret to `.env.production`

### Products and Pricing

Create your phone number products in Stripe Dashboard with:
- Recurring monthly pricing
- Metadata fields:
  - `country_code`
  - `area_code`
  - `phone_number`

## 3. DIDWW Configuration

1. Get your API credentials from DIDWW portal
2. Configure webhook endpoints in DIDWW:
   - Voice CDR: `https://your-domain.com/api/webhooks/didww`
   - SMS webhook: `https://your-domain.com/api/webhooks/sms`
3. Ensure your account has sufficient balance for number provisioning

## 4. Email Service (Resend)

1. Sign up at https://resend.com
2. Verify your domain
3. Get API key and add to `.env.production`
4. Update `RESEND_FROM_EMAIL` with your verified sender address

## 5. Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... add all other env variables
```

### Option B: Netlify

```bash
# Build the application
npm run build

# Deploy using Netlify CLI
netlify deploy --prod --dir=.next

# Set environment variables in Netlify Dashboard
```

### Option C: Self-Hosted (Docker)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t numninja .
docker run -p 3000:3000 --env-file .env.production numninja
```

## 6. Post-Deployment Checklist

### Security

- [ ] Enable RLS policies in Supabase (already configured in migration)
- [ ] Set up rate limiting on API routes
- [ ] Configure CORS settings
- [ ] Enable SSL/TLS on your domain
- [ ] Set up monitoring (Sentry, LogRocket, etc.)

### Testing

- [ ] Test complete purchase flow with real payment
- [ ] Verify email notifications are working
- [ ] Test phone number provisioning
- [ ] Verify webhook endpoints are receiving events
- [ ] Test user dashboard functionality
- [ ] Check admin panel access

### Monitoring

Set up monitoring for:
- Application errors (Sentry)
- API response times
- Database query performance
- Stripe webhook failures
- Email delivery rates
- DIDWW API availability

## 7. Backup and Recovery

### Database Backups

Supabase automatically backs up your database. Additionally:

1. Set up regular exports:
```bash
pg_dump -h your-db-host -U your-db-user -d your-db-name > backup.sql
```

2. Store backups in separate location (AWS S3, Google Cloud Storage)

### Application Backups

- Keep your code in Git repository
- Tag releases for easy rollback
- Document all configuration changes

## 8. Scaling Considerations

### Database Optimization

- Add indexes for frequently queried columns
- Use connection pooling
- Consider read replicas for heavy read loads

### Application Optimization

- Enable Next.js ISR (Incremental Static Regeneration)
- Use CDN for static assets
- Implement caching strategies
- Consider edge functions for global distribution

## 9. Maintenance

### Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Review and rotate API keys periodically
- Update RLS policies as needed

### Monitoring Checklist

Weekly:
- Review error logs
- Check payment processing
- Monitor provisioning queue
- Review usage statistics

Monthly:
- Audit user permissions
- Review security settings
- Check backup integrity
- Update documentation

## 10. Troubleshooting

### Common Issues

**Provisioning Failures**
- Check DIDWW API credentials
- Verify account balance
- Review provisioning queue logs

**Payment Issues**
- Verify Stripe webhook configuration
- Check webhook signing secret
- Review Stripe logs

**Authentication Problems**
- Verify Supabase URL and keys
- Check RLS policies
- Review auth configuration

**Email Delivery**
- Verify Resend API key
- Check domain verification
- Review email templates

## Support

For production support:
- DIDWW: support@didww.com
- Stripe: https://support.stripe.com
- Supabase: https://supabase.com/support
- Resend: https://resend.com/support

## Environment Variables Reference

```env
# Required
NEXT_PUBLIC_BASE_URL          # Your production URL
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key
STRIPE_SECRET_KEY              # Stripe secret key (live)
STRIPE_WEBHOOK_SECRET          # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe publishable key (live)
DIDWW_API_KEY                  # DIDWW API key
RESEND_API_KEY                 # Resend API key

# Optional
DIDWW_BASE_URL                 # Default: https://api.didww.com/v3
DIDWW_ENVIRONMENT              # Set to 'production'
RESEND_FROM_EMAIL              # Default sender email
NEXT_PUBLIC_GA_MEASUREMENT_ID  # Google Analytics
SENTRY_DSN                     # Error tracking
```

## License

Ensure you comply with all third-party service terms of service and licensing agreements.