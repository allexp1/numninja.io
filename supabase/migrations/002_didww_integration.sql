-- Add DIDWW integration columns to purchased_numbers table
ALTER TABLE purchased_numbers 
ADD COLUMN IF NOT EXISTS didww_did_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provisioning_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (provisioning_status IN ('pending', 'active', 'suspended', 'cancelled', 'failed')),
ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_provision_error TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Create index for DIDWW DID ID lookups
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_didww_did_id ON purchased_numbers(didww_did_id);
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_stripe_payment_intent ON purchased_numbers(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_stripe_checkout_session ON purchased_numbers(stripe_checkout_session_id);

-- Call Detail Records table
CREATE TABLE IF NOT EXISTS call_detail_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    didww_cdr_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    duration_seconds INTEGER DEFAULT 0,
    answered BOOLEAN DEFAULT false,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    cost DECIMAL(10, 4),
    currency VARCHAR(3),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Records table
CREATE TABLE IF NOT EXISTS sms_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    didww_sms_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    message TEXT,
    delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    cost DECIMAL(10, 4),
    currency VARCHAR(3),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Number Usage Statistics table
CREATE TABLE IF NOT EXISTS number_usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    total_sms INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(purchased_number_id, period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cdr_purchased_number_id ON call_detail_records(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_cdr_start_time ON call_detail_records(start_time);
CREATE INDEX IF NOT EXISTS idx_cdr_didww_id ON call_detail_records(didww_cdr_id);

CREATE INDEX IF NOT EXISTS idx_sms_purchased_number_id ON sms_records(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_sms_created_at ON sms_records(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_didww_id ON sms_records(didww_sms_id);

CREATE INDEX IF NOT EXISTS idx_usage_stats_purchased_number_id ON number_usage_stats(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_period ON number_usage_stats(period_start, period_end);

-- Enable Row Level Security
ALTER TABLE call_detail_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CDRs - users can only see their own call records
CREATE POLICY "Users can view own call records" ON call_detail_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = call_detail_records.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- RLS Policies for SMS - users can only see their own SMS records
CREATE POLICY "Users can view own SMS records" ON sms_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = sms_records.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- RLS Policies for Usage Stats - users can only see their own usage stats
CREATE POLICY "Users can view own usage stats" ON number_usage_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_usage_stats.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_number_usage_stats_updated_at BEFORE UPDATE ON number_usage_stats
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();