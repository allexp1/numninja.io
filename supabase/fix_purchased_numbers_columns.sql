-- Add missing columns to purchased_numbers table
ALTER TABLE purchased_numbers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS setup_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS provisioning_status TEXT DEFAULT 'pending';

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_numbers'
ORDER BY ordinal_position;