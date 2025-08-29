# Custom Domain Setup Guide for NumNinja

## Overview
This guide will help you configure your custom domain `numninja.io` to point to your Vercel deployment.

## Current Status
- **Vercel URL**: https://numninja-io.vercel.app
- **Target Domain**: numninja.io
- **Target www**: www.numninja.io

## Step-by-Step Configuration

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your **numninja-io** project
3. Navigate to **Settings** → **Domains**

### Step 2: Add Custom Domain
1. Click **"Add"** button
2. Enter your domain: `numninja.io`
3. Click **"Add"**
4. Vercel will show you DNS records to configure

### Step 3: Configure DNS Records

You'll need to configure DNS records with your domain registrar (where you bought numninja.io).

#### Option A: Using Vercel Nameservers (Recommended)
Change your domain's nameservers to Vercel's:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### Option B: Using Your Registrar's DNS
Add these DNS records at your domain registrar:

**For apex domain (numninja.io):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain (www.numninja.io):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 4: Common Domain Registrars Configuration

#### GoDaddy
1. Log into GoDaddy
2. Go to **My Products** → **Domains**
3. Click **DNS** next to numninja.io
4. Add the A and CNAME records above

#### Namecheap
1. Log into Namecheap
2. Go to **Domain List**
3. Click **Manage** next to numninja.io
4. Go to **Advanced DNS**
5. Add the records above

#### Cloudflare
1. Log into Cloudflare
2. Select your domain
3. Go to **DNS**
4. Add the records (set Proxy status to **DNS only** initially)

#### Google Domains
1. Log into Google Domains
2. Click on numninja.io
3. Go to **DNS** → **Manage custom records**
4. Add the records above

### Step 5: Wait for DNS Propagation
- DNS changes can take 0-48 hours to propagate globally
- Usually happens within 1-4 hours
- You can check propagation at: https://dnschecker.org

### Step 6: Verify Domain in Vercel
1. Return to Vercel Dashboard → Settings → Domains
2. You should see your domain with status indicators
3. Once DNS propagates, you'll see green checkmarks
4. Vercel automatically provisions SSL certificates

### Step 7: Update Environment Variables

After domain is verified, update these in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Update or add for Production:
   ```
   NEXT_PUBLIC_APP_URL=https://numninja.io
   ```

3. Update Supabase redirect URLs:
   - Go to Supabase Dashboard
   - Authentication → URL Configuration
   - Add to Redirect URLs:
     ```
     https://numninja.io/auth/callback
     https://numninja.io/auth/verify
     https://www.numninja.io/auth/callback
     https://www.numninja.io/auth/verify
     ```

4. Update Stripe webhook endpoint:
   - Go to Stripe Dashboard → Webhooks
   - Update endpoint URL to:
     ```
     https://numninja.io/api/checkout/webhook
     ```

### Step 8: Redeploy Application
1. In Vercel, go to **Deployments**
2. Redeploy latest deployment
3. Test your domain works

## Testing Your Domain

### Check these URLs work:
- https://numninja.io
- https://www.numninja.io
- Both should redirect to HTTPS
- Both should show your application

### Test critical flows:
1. Sign up flow
2. Sign in flow
3. Browse numbers
4. Add to cart
5. Checkout process

## Troubleshooting

### Domain Not Working

**Issue**: "Domain not found" or "This site can't be reached"
**Solution**: 
- Check DNS records are correct
- Wait for DNS propagation (up to 48 hours)
- Verify domain in Vercel dashboard

### SSL Certificate Error

**Issue**: Browser shows security warning
**Solution**:
- Vercel automatically provisions SSL certificates
- This can take up to 24 hours after domain verification
- Check Vercel dashboard for certificate status

### Redirect Issues

**Issue**: Auth callbacks not working with new domain
**Solution**:
- Update Supabase redirect URLs (Step 7)
- Update NEXT_PUBLIC_APP_URL in Vercel
- Redeploy application

### www vs non-www

**Issue**: Only one version works
**Solution**:
- Add both domains in Vercel (numninja.io and www.numninja.io)
- Configure DNS for both
- Vercel will handle redirects

## Email Configuration (Optional)

If you want email addresses like hello@numninja.io:

### Option 1: Email Forwarding (Simple)
Many registrars offer free email forwarding:
- Forward hello@numninja.io → your.email@gmail.com

### Option 2: Professional Email
Use services like:
- Google Workspace ($6/user/month)
- Microsoft 365 ($6/user/month)
- Zoho Mail (Free tier available)

Add MX records provided by your email service.

## Monitoring

### Uptime Monitoring
Consider setting up monitoring:
- Vercel Analytics (built-in)
- UptimeRobot (free)
- Pingdom
- StatusCake

### Domain Expiration
- Set calendar reminder for domain renewal
- Enable auto-renewal with registrar
- Keep payment method updated

## Security Considerations

### DNS Security
- Enable DNSSEC if available
- Use registrar lock to prevent unauthorized transfers
- Enable 2FA on domain registrar account

### Subdomain Takeover Prevention
- Remove unused DNS records
- Monitor for subdomain changes
- Use CAA records to restrict SSL certificate issuance

## Final Checklist

- [ ] Domain added in Vercel
- [ ] DNS records configured
- [ ] DNS propagated (check dnschecker.org)
- [ ] SSL certificate active
- [ ] Both www and non-www work
- [ ] Environment variables updated
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhook URL updated
- [ ] Application redeployed
- [ ] All features tested on new domain

## Support Resources

- **Vercel Domains**: https://vercel.com/docs/concepts/projects/domains
- **DNS Checker**: https://dnschecker.org
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Vercel Support**: https://vercel.com/support

## Next Steps

Once your domain is working:
1. Update all marketing materials with new URL
2. Set up domain email if needed
3. Configure analytics for new domain
4. Update social media profiles
5. Submit sitemap to search engines