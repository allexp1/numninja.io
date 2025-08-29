# Apply Database Migration for DIDWW Integration

## Steps to Apply the Migration

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project (qzcjbmsrroolbkxodgbo)
3. Navigate to the SQL Editor in the left sidebar

### 2. Run the Migration
1. Click "New Query" in the SQL Editor
2. Copy the entire contents of `supabase/migrations/002_didww_integration.sql`
3. Paste it into the query editor
4. Click "Run" to execute the migration

### 3. Verify Migration Success
After running the migration, verify the following tables and columns exist:

**Updated Tables:**
- `purchased_numbers` - Added columns:
  - `didww_did_id`
  - `provisioning_status`
  - `provisioned_at`
  - `last_provision_error`
  - `stripe_payment_intent_id`
  - `stripe_checkout_session_id`

**New Tables:**
- `call_detail_records` - Stores call history
- `sms_records` - Stores SMS messages
- `number_usage_stats` - Tracks usage statistics

### 4. Test the Schema
Run this query to verify the schema:
```sql
-- Check purchased_numbers columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_numbers' 
AND column_name IN ('didww_did_id', 'provisioning_status', 'provisioned_at');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('call_detail_records', 'sms_records', 'number_usage_stats');
```

## Complete DIDWW Webhook Configuration

### Step 1: Configure in DIDWW Dashboard
1. Log into DIDWW at https://www.didww.com
2. Navigate to API Settings → Webhooks
3. Add a new webhook with:
   - **URL**: `https://numninja-io.vercel.app/api/webhooks/didww`
   - **Method**: POST
   - **Events**: Select all available events

### Step 2: Get Webhook Secret
1. DIDWW will provide a webhook secret
2. Copy this secret (it looks like: `whsec_xxxxxxxxxxxxxx`)

### Step 3: Add Secret to Vercel
1. Go to https://vercel.com/dashboard
2. Select your NumNinja project
3. Go to Settings → Environment Variables
4. Add for Production:
   ```
   Variable Name: DIDWW_WEBHOOK_SECRET
   Value: [paste the secret from DIDWW]
   ```
5. Also add (if not already present):
   ```
   Variable Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [get from Supabase dashboard → Settings → API]
   ```

### Step 4: Redeploy Application
1. Go to Deployments in Vercel
2. Click on the three dots next to the latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete

### Step 5: Test Webhook
Use the test script to verify the production webhook:
```bash
# Set the webhook secret as environment variable
export DIDWW_WEBHOOK_SECRET="your-actual-secret-from-didww"

# Test production webhook
node scripts/test-didww-webhook.js production provisioned
```

### Step 6: Verify in DIDWW Dashboard
1. In DIDWW webhook settings, look for "Test" or "Send Test Event"
2. Send a test event
3. Check Vercel Function Logs to confirm receipt

## Monitoring Webhooks

### Vercel Function Logs
1. Go to Vercel Dashboard → Functions
2. Click on `/api/webhooks/didww`
3. View real-time logs

### Supabase Database
Check if webhook events are being recorded:
```sql
-- Check recent CDRs
SELECT * FROM call_detail_records ORDER BY created_at DESC LIMIT 10;

-- Check recent SMS
SELECT * FROM sms_records ORDER BY created_at DESC LIMIT 10;

-- Check number status updates
SELECT phone_number, provisioning_status, provisioned_at 
FROM purchased_numbers 
WHERE didww_did_id IS NOT NULL 
ORDER BY updated_at DESC LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized in webhook logs**
   - Verify `DIDWW_WEBHOOK_SECRET` in Vercel matches DIDWW dashboard
   - Ensure environment variable is set for Production

2. **Database errors in webhook logs**
   - Verify migration was applied successfully
   - Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel

3. **Webhook not receiving events**
   - Verify webhook URL in DIDWW is exactly: `https://numninja-io.vercel.app/api/webhooks/didww`
   - Check if DIDWW requires IP whitelisting (Vercel IPs may change)
   - Ensure webhook is enabled in DIDWW dashboard

## Next Steps
Once DIDWW webhooks are configured:
1. Configure Stripe webhooks for payment processing
2. Set up custom domain (numninja.io)
3. Test end-to-end number provisioning flow