# Stripe Webhook Configuration for Production

## Overview
Stripe webhooks are **ESSENTIAL** for NumNinja to function properly. They handle payment confirmations, subscription management, and automatic number provisioning after payment.

## Your Webhook Endpoint
```
https://numninja-io.vercel.app/api/checkout/webhook
```

## Events Your Webhook Handles
✅ **Payment Events:**
- `checkout.session.completed` - When customer completes payment
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed

✅ **Subscription Events:**
- `customer.subscription.created` - New subscription started
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled

✅ **Invoice Events:**
- `invoice.payment_succeeded` - Recurring payment successful
- `invoice.payment_failed` - Recurring payment failed

## Step-by-Step Setup Guide

### Step 1: Access Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Make sure you're in **PRODUCTION mode** (not test mode)
   - Toggle switch in top right should NOT say "Test mode"
3. Navigate to **Developers** → **Webhooks**

### Step 2: Create Production Webhook Endpoint
1. Click **"Add endpoint"**
2. Enter endpoint URL:
   ```
   https://numninja-io.vercel.app/api/checkout/webhook
   ```
3. Select events to listen for:
   - Click **"Select events"**
   - Select the following events:
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. Click **"Add endpoint"**

### Step 3: Get Webhook Signing Secret
1. After creating the endpoint, you'll see the webhook details
2. Look for **"Signing secret"** section
3. Click **"Reveal"** or **"Click to reveal"**
4. Copy the signing secret (starts with `whsec_`)
   ```
   Example: whsec_1234567890abcdef...
   ```

### Step 4: Add to Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your **numninja-io** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable for **Production**:
   ```
   Name: STRIPE_WEBHOOK_SECRET
   Value: [paste the whsec_ secret from Stripe]
   Environment: Production ✓
   ```
5. Also ensure these are set for Production:
   ```
   STRIPE_SECRET_KEY = sk_live_... (your production secret key)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_... (your production publishable key)
   SUPABASE_SERVICE_ROLE_KEY = [from Supabase dashboard]
   ```

### Step 5: Redeploy Application
1. In Vercel, go to **Deployments**
2. Click the three dots (...) next to the latest deployment
3. Select **"Redeploy"**
4. Choose **"Use existing Build Cache"** → **"Redeploy"**
5. Wait for deployment to complete (~1-2 minutes)

### Step 6: Test Webhook Connection
1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select event type: `checkout.session.completed`
4. Click **"Send test webhook"**
5. You should see:
   - ✅ Success response (200 OK)
   - Response body: `{"received":true}`

### Step 7: Verify in Vercel Logs
1. Go to Vercel Dashboard → **Functions** → **Logs**
2. Filter for `/api/checkout/webhook`
3. You should see successful webhook receipts

## Testing with Real Payments (Optional)

### Create a Test Purchase:
1. Use Stripe's test card in production:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - This will create a real charge but you can refund it

### Monitor the Flow:
1. Check Stripe Dashboard → **Events**
2. Check Vercel Function Logs
3. Check Supabase database for new records

## Important Environment Variables

Make sure ALL of these are set in Vercel for Production:

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=https://qzcjbmsrroolbkxodgbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (get from Supabase dashboard)

# DIDWW API (for number provisioning)
DIDWW_API_KEY=NRdukFzgxq4kSkiiWz7Vfy01Pl$pEVKh
DIDWW_API_URL=https://api.didww.com/v3
```

## Common Issues & Solutions

### Issue: 400 Bad Request - Invalid Signature
**Solution:** 
- Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches the one from Stripe Dashboard
- Make sure you're using the Production webhook secret, not Test

### Issue: 500 Internal Server Error
**Solution:**
- Check if `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Verify database tables exist (orders, purchased_numbers, etc.)

### Issue: Webhook Events Not Arriving
**Solution:**
- Verify endpoint URL is exactly: `https://numninja-io.vercel.app/api/checkout/webhook`
- Check if Vercel deployment is successful
- Ensure webhook is enabled in Stripe Dashboard

### Issue: Payment Succeeds but Number Not Provisioned
**Solution:**
- This is expected with API-only DIDWW integration
- Numbers will be marked as purchased but provisioning happens via API
- Check `purchased_numbers` table in Supabase

## Monitoring Webhooks

### Stripe Dashboard
- Go to **Developers** → **Webhooks** → Click on your endpoint
- View **Recent deliveries** to see webhook attempts
- Check for any failed deliveries

### Vercel Function Logs
- Real-time logs: Vercel Dashboard → Functions → `/api/checkout/webhook`
- Look for console.log outputs from your webhook handler

### Database Records
Check Supabase for new records after payments:
```sql
-- Check recent orders
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check purchased numbers
SELECT * FROM purchased_numbers 
ORDER BY created_at DESC 
LIMIT 10;

-- Check payments
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;
```

## What Happens When Someone Pays?

1. **Customer completes checkout** → Stripe charges card
2. **Stripe sends webhook** → `checkout.session.completed`
3. **Your webhook handler**:
   - Creates order record
   - Creates purchased_numbers records
   - Clears user's cart
   - Triggers number provisioning (if using webhooks)
4. **Customer sees** → Success page with their new numbers

## Security Notes

- **Never expose** your webhook signing secret
- **Always verify** webhook signatures (already implemented)
- **Use HTTPS** for webhook endpoint (Vercel handles this)
- **Idempotency** - webhook handler can safely process duplicate events

## Next Steps

After configuring Stripe webhooks:
1. ✅ Make a test purchase to verify flow
2. ✅ Check database for created records
3. ✅ Monitor first real customer purchases
4. ✅ Set up custom domain (numninja.io)

## Support

- **Stripe Support**: https://support.stripe.com
- **Webhook Documentation**: https://stripe.com/docs/webhooks
- **Testing Webhooks**: https://stripe.com/docs/webhooks/test