# Database Setup Instructions

## Step 1: Run Migrations in Supabase Dashboard

### Option A: Using Supabase CLI (Requires Docker & Authentication)
If you have Docker installed and can authenticate with Supabase:
```bash
# Login to Supabase (requires access token)
supabase login

# Link to your project
supabase link --project-ref qzcjbmsrroolbkxodgbo

# Run migrations
supabase db push
```

### Option B: Manual SQL Execution (Recommended)
1. Open your Supabase SQL Editor:
   https://app.supabase.com/project/qzcjbmsrroolbkxodgbo/editor

2. Copy the entire contents of `supabase/combined_migrations.sql`

3. Paste it into the SQL Editor

4. Click "Run" to execute all migrations

5. Verify the tables were created:
   - Go to Table Editor: https://app.supabase.com/project/qzcjbmsrroolbkxodgbo/editor
   - You should see these tables:
     - `countries`
     - `area_codes`
     - `forwarding_prices`
     - `profiles`
     - `purchased_numbers`
     - `number_configurations`
     - `call_detail_records`
     - `sms_records`
     - `number_usage_stats`
     - `provisioning_queue`
     - `orders`
     - `payments`
     - `cart_items`
     - `sms_configurations`
     - `sms_filter_rules`
     - `sms_forwarding_logs`
     - `sms_auto_reply_logs`

## Step 2: Seed Initial Data

After running migrations, execute the seed data script:
```bash
node scripts/seed-data.js
```

This will populate:
- Countries (USA, UK, Canada, etc.)
- Area codes for each country
- Forwarding prices per country
- Test phone numbers for development

## Step 3: Verify Setup

Test that everything is working:
```bash
node scripts/verify-database.js
```

This will check:
- All tables exist
- RLS policies are enabled
- Can read public data (countries, area codes)
- Authentication works for protected tables

## Troubleshooting

### If migrations fail:
1. Check for existing tables that might conflict
2. You may need to drop existing tables first (be careful with production data!)
3. Run migrations one at a time if needed

### If you get permission errors:
1. Make sure you're using the correct Supabase project
2. Verify your environment variables in `.env.local`
3. Check that RLS is properly configured

### To reset the database (DANGER - will delete all data):
```sql
-- Run this in SQL Editor to drop all tables and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
```

Then run the migrations again.

## Next Steps

After database setup is complete:
1. Configure Stripe webhooks
2. Set up DIDWW API credentials (when ready for production)
3. Test the purchase flow with mock data
4. Configure SMS forwarding settings