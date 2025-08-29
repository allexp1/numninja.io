-- Add provisioning-related columns to purchased_numbers table
ALTER TABLE purchased_numbers 
ADD COLUMN IF NOT EXISTS didww_did_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provisioning_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS provisioning_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_provision_error TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS setup_price DECIMAL(10, 2);

-- Add constraints for provisioning_status
ALTER TABLE purchased_numbers 
ADD CONSTRAINT purchased_numbers_provisioning_status_check 
CHECK (provisioning_status IN ('pending', 'provisioning', 'active', 'failed', 'cancelled', 'suspended'));

-- Create provisioning_queue table for async processing
CREATE TABLE IF NOT EXISTS provisioning_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('provision', 'update_forwarding', 'cancel', 'suspend', 'reactivate')),
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_detail_records table
CREATE TABLE IF NOT EXISTS call_detail_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    didww_cdr_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    duration_seconds INTEGER,
    answered BOOLEAN DEFAULT false,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    cost DECIMAL(10, 4),
    currency VARCHAR(3),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sms_records table
CREATE TABLE IF NOT EXISTS sms_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    didww_sms_id VARCHAR(255) UNIQUE,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    message TEXT,
    delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    cost DECIMAL(10, 4),
    currency VARCHAR(3),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create number_usage_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS number_usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    total_sms INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(purchased_number_id, period_start, period_end)
);

-- Create orders table for tracking Stripe orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    total_amount DECIMAL(10, 2),
    currency VARCHAR(3),
    status VARCHAR(50),
    payment_status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table for tracking recurring payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(3),
    status VARCHAR(50),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart_items table for shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id),
    area_code_id UUID NOT NULL REFERENCES area_codes(id),
    phone_number VARCHAR(20),
    monthly_price DECIMAL(10, 2),
    setup_price DECIMAL(10, 2),
    sms_enabled BOOLEAN DEFAULT false,
    forwarding_type VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, phone_number)
);

-- Create indexes for better performance
CREATE INDEX idx_purchased_numbers_didww_did_id ON purchased_numbers(didww_did_id);
CREATE INDEX idx_purchased_numbers_provisioning_status ON purchased_numbers(provisioning_status);
CREATE INDEX idx_purchased_numbers_stripe_subscription_id ON purchased_numbers(stripe_subscription_id);
CREATE INDEX idx_provisioning_queue_status ON provisioning_queue(status);
CREATE INDEX idx_provisioning_queue_scheduled_for ON provisioning_queue(scheduled_for);
CREATE INDEX idx_call_detail_records_purchased_number_id ON call_detail_records(purchased_number_id);
CREATE INDEX idx_call_detail_records_start_time ON call_detail_records(start_time);
CREATE INDEX idx_sms_records_purchased_number_id ON sms_records(purchased_number_id);
CREATE INDEX idx_sms_records_created_at ON sms_records(created_at);
CREATE INDEX idx_number_usage_stats_purchased_number_id ON number_usage_stats(purchased_number_id);
CREATE INDEX idx_number_usage_stats_period ON number_usage_stats(period_start, period_end);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_provisioning_queue_updated_at BEFORE UPDATE ON provisioning_queue
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_number_usage_stats_updated_at BEFORE UPDATE ON number_usage_stats
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE provisioning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_detail_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provisioning_queue (admin only)
CREATE POLICY "Only admins can view provisioning queue" ON provisioning_queue
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can manage provisioning queue" ON provisioning_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for call_detail_records
CREATE POLICY "Users can view own call records" ON call_detail_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = call_detail_records.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- RLS Policies for sms_records
CREATE POLICY "Users can view own SMS records" ON sms_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = sms_records.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- RLS Policies for number_usage_stats
CREATE POLICY "Users can view own usage stats" ON number_usage_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_usage_stats.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for cart_items
CREATE POLICY "Users can view own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);