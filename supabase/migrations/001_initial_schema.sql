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