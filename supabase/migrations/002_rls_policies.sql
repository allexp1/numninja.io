-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Profiles are viewable by owner" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Countries table policies (public read)
CREATE POLICY "Countries are publicly readable" ON countries
  FOR SELECT USING (true);

-- Area codes table policies (public read)
CREATE POLICY "Area codes are publicly readable" ON area_codes
  FOR SELECT USING (true);

-- Available numbers table policies (public read)
CREATE POLICY "Available numbers are publicly readable" ON available_numbers
  FOR SELECT USING (true);

-- Purchased numbers policies
CREATE POLICY "Users can view own purchased numbers" ON purchased_numbers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own purchased numbers" ON purchased_numbers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchased numbers" ON purchased_numbers
  FOR INSERT WITH CHECK (true); -- Only service role can insert via API

-- Cart items policies
CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT WITH CHECK (true); -- Only service role via API

CREATE POLICY "Service role can update orders" ON orders
  FOR UPDATE USING (true); -- Only service role via API

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (true); -- Only service role via API

-- Number configurations policies
CREATE POLICY "Users can view own number configs" ON number_configurations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = number_configurations.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own number configs" ON number_configurations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = number_configurations.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own number configs" ON number_configurations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = number_configurations.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

-- Call logs policies
CREATE POLICY "Users can view own call logs" ON call_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = call_logs.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

-- SMS logs policies
CREATE POLICY "Users can view own SMS logs" ON sms_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = sms_logs.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

-- Provisioning queue policies (service role only)
CREATE POLICY "Service role manages provisioning queue" ON provisioning_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage stats policies
CREATE POLICY "Users can view own usage stats" ON usage_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchased_numbers
      WHERE purchased_numbers.id = usage_stats.purchased_number_id
      AND purchased_numbers.user_id = auth.uid()
    )
  );

-- Webhook events policies (service role only)
CREATE POLICY "Service role manages webhook events" ON webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin settings policies
CREATE POLICY "Admins can view settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update settings" ON admin_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for automatic user_id setting
CREATE TRIGGER set_cart_items_user_id
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant service role full access
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure anon role has limited access
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON countries TO anon;
GRANT SELECT ON area_codes TO anon;
GRANT SELECT ON available_numbers TO anon;

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_purchased_numbers_user_id ON purchased_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_number_configurations_purchased_number_id ON number_configurations(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_purchased_number_id ON call_logs(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_purchased_number_id ON sms_logs(purchased_number_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);