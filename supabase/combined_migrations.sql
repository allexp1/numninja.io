-- ============================================
-- Combined Supabase Migrations for NumNinja
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com/project/qzcjbmsrroolbkxodgbo/editor
-- ============================================

-- Migration: 001_initial_schema.sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Countries table
CREATE TABLE countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sms_capable BOOLEAN DEFAULT false,
    documents_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Area codes table
CREATE TABLE area_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    area_code VARCHAR(10) NOT NULL,
    city TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    sms_addon_price DECIMAL(10, 2) DEFAULT 0,
    is_sms_capable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, area_code)
);

-- Forwarding prices table
CREATE TABLE forwarding_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    mobile_price DECIMAL(10, 2) DEFAULT 20.00,
    landline_price DECIMAL(10, 2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id)
);

-- Extend auth.users table with additional profile fields
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Create a profiles table to store additional user data
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone VARCHAR(20),
    full_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchased numbers table
CREATE TABLE purchased_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES countries(id),
    area_code_id UUID NOT NULL REFERENCES area_codes(id),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Number configurations table
CREATE TABLE number_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchased_number_id UUID NOT NULL REFERENCES purchased_numbers(id) ON DELETE CASCADE,
    forwarding_type VARCHAR(20) CHECK (forwarding_type IN ('mobile', 'landline', 'voip', 'none')) DEFAULT 'none',
    forwarding_number VARCHAR(20),
    voicemail_enabled BOOLEAN DEFAULT true,
    voicemail_email VARCHAR(255),
    call_recording_enabled BOOLEAN DEFAULT false,
    business_hours_enabled BOOLEAN DEFAULT false,
    business_hours_start TIME,
    business_hours_end TIME,
    business_hours_timezone VARCHAR(50) DEFAULT 'UTC',
    weekend_handling VARCHAR(20) CHECK (weekend_handling IN ('forward', 'voicemail', 'reject')) DEFAULT 'forward',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(purchased_number_id)
);

-- Create indexes for better performance
CREATE INDEX idx_area_codes_country_id ON area_codes(country_id);
CREATE INDEX idx_area_codes_area_code ON area_codes(area_code);
CREATE INDEX idx_area_codes_city ON area_codes(city);
CREATE INDEX idx_forwarding_prices_country_id ON forwarding_prices(country_id);
CREATE INDEX idx_purchased_numbers_user_id ON purchased_numbers(user_id);
CREATE INDEX idx_purchased_numbers_phone_number ON purchased_numbers(phone_number);
CREATE INDEX idx_purchased_numbers_is_active ON purchased_numbers(is_active);
CREATE INDEX idx_number_configurations_purchased_number_id ON number_configurations(purchased_number_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_area_codes_updated_at BEFORE UPDATE ON area_codes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_forwarding_prices_updated_at BEFORE UPDATE ON forwarding_prices
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_purchased_numbers_updated_at BEFORE UPDATE ON purchased_numbers
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_number_configurations_updated_at BEFORE UPDATE ON number_configurations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarding_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Countries table - everyone can read
CREATE POLICY "Countries are viewable by everyone" ON countries
    FOR SELECT USING (true);

-- Area codes table - everyone can read
CREATE POLICY "Area codes are viewable by everyone" ON area_codes
    FOR SELECT USING (true);

-- Forwarding prices table - everyone can read
CREATE POLICY "Forwarding prices are viewable by everyone" ON forwarding_prices
    FOR SELECT USING (true);

-- Profiles table - users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Purchased numbers table - users can only see and manage their own numbers
CREATE POLICY "Users can view own purchased numbers" ON purchased_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchased numbers" ON purchased_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchased numbers" ON purchased_numbers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchased numbers" ON purchased_numbers
    FOR DELETE USING (auth.uid() = user_id);

-- Number configurations table - users can only see and manage configurations for their own numbers
CREATE POLICY "Users can view own number configurations" ON number_configurations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_configurations.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own number configurations" ON number_configurations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_configurations.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own number configurations" ON number_configurations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_configurations.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own number configurations" ON number_configurations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchased_numbers 
            WHERE purchased_numbers.id = number_configurations.purchased_number_id 
            AND purchased_numbers.user_id = auth.uid()
        )
    );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, phone, full_address)
    VALUES (new.id, new.phone, new.raw_user_meta_data->>'full_address');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Migration: 002_didww_integration.sql
-- ============================================

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

-- Migration: 003_provisioning_schema.sql
-- ============================================

-- Note: Some columns may already exist from migration 002
-- Add provisioning-related columns to purchased_numbers table (IF NOT EXISTS)
ALTER TABLE purchased_numbers 
ADD COLUMN IF NOT EXISTS provisioning_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS setup_price DECIMAL(10, 2);

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

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_provisioning_status ON purchased_numbers(provisioning_status);
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_stripe_subscription_id ON purchased_numbers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_status ON provisioning_queue(status);
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_scheduled_for ON provisioning_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_provisioning_queue_updated_at BEFORE UPDATE ON provisioning_queue
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE provisioning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provisioning_queue (admin only)
CREATE POLICY "Only admins can view provisioning queue" ON provisioning_queue
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can manage provisioning queue" ON provisioning_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

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

-- Migration: 004_sms_configuration.sql
-- ============================================

-- SMS Configuration Tables

-- Table for storing SMS forwarding configuration
CREATE TABLE IF NOT EXISTS public.sms_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchased_number_id UUID NOT NULL REFERENCES public.purchased_numbers(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    forward_to_emails TEXT[] DEFAULT '{}',
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT,
    filter_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(purchased_number_id)
);

-- Table for SMS filter rules
CREATE TABLE IF NOT EXISTS public.sms_filter_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_configuration_id UUID NOT NULL REFERENCES public.sms_configurations(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('keyword', 'sender', 'blacklist')),
    pattern TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('forward', 'block', 'auto_reply')),
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for SMS forwarding logs
CREATE TABLE IF NOT EXISTS public.sms_forwarding_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_record_id UUID NOT NULL REFERENCES public.sms_records(id) ON DELETE CASCADE,
    email_recipient TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for auto-reply logs
CREATE TABLE IF NOT EXISTS public.sms_auto_reply_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_record_id UUID NOT NULL REFERENCES public.sms_records(id) ON DELETE CASCADE,
    reply_message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_sms_configurations_purchased_number_id ON public.sms_configurations(purchased_number_id);
CREATE INDEX idx_sms_filter_rules_configuration_id ON public.sms_filter_rules(sms_configuration_id);
CREATE INDEX idx_sms_filter_rules_enabled ON public.sms_filter_rules(enabled);
CREATE INDEX idx_sms_forwarding_logs_sms_record_id ON public.sms_forwarding_logs(sms_record_id);
CREATE INDEX idx_sms_forwarding_logs_status ON public.sms_forwarding_logs(status);
CREATE INDEX idx_sms_auto_reply_logs_sms_record_id ON public.sms_auto_reply_logs(sms_record_id);

-- Update trigger for updated_at
CREATE TRIGGER update_sms_configurations_updated_at BEFORE UPDATE ON public.sms_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_filter_rules_updated_at BEFORE UPDATE ON public.sms_filter_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_forwarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_auto_reply_logs ENABLE ROW LEVEL SECURITY;

-- Policies for sms_configurations
CREATE POLICY "Users can view their own SMS configurations"
    ON public.sms_configurations FOR SELECT
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own SMS configurations"
    ON public.sms_configurations FOR INSERT
    WITH CHECK (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own SMS configurations"
    ON public.sms_configurations FOR UPDATE
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own SMS configurations"
    ON public.sms_configurations FOR DELETE
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

-- Policies for sms_filter_rules
CREATE POLICY "Users can view their own SMS filter rules"
    ON public.sms_filter_rules FOR SELECT
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own SMS filter rules"
    ON public.sms_filter_rules FOR INSERT
    WITH CHECK (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own SMS filter rules"
    ON public.sms_filter_rules FOR UPDATE
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own SMS filter rules"
    ON public.sms_filter_rules FOR DELETE
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

-- Policies for sms_forwarding_logs
CREATE POLICY "Users can view their own SMS forwarding logs"
    ON public.sms_forwarding_logs FOR SELECT
    USING (sms_record_id IN (
        SELECT sr.id FROM public.sms_records sr
        JOIN public.purchased_numbers pn ON sr.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

-- Policies for sms_auto_reply_logs
CREATE POLICY "Users can view their own SMS auto-reply logs"
    ON public.sms_auto_reply_logs FOR SELECT
    USING (sms_record_id IN (
        SELECT sr.id FROM public.sms_records sr
        JOIN public.purchased_numbers pn ON sr.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

-- ============================================
-- END OF MIGRATIONS
-- ============================================