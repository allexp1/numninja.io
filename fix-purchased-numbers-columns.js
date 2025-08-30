const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixPurchasedNumbersColumns() {
  console.log('Adding missing columns to purchased_numbers table...\n');
  
  // Add missing columns
  const alterTableSQL = `
    ALTER TABLE purchased_numbers
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
    ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS setup_price DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS provisioning_status TEXT DEFAULT 'pending';
  `;
  
  const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL }).catch(async (err) => {
    // If RPC doesn't exist, try direct approach
    console.log('Using direct SQL approach...');
    
    // Try each column individually
    const columns = [
      { name: 'is_active', type: 'BOOLEAN DEFAULT false' },
      { name: 'sms_enabled', type: 'BOOLEAN DEFAULT false' },
      { name: 'purchase_date', type: 'TIMESTAMPTZ DEFAULT NOW()' },
      { name: 'stripe_subscription_id', type: 'TEXT' },
      { name: 'stripe_checkout_session_id', type: 'TEXT' },
      { name: 'monthly_price', type: 'DECIMAL(10,2)' },
      { name: 'setup_price', type: 'DECIMAL(10,2)' },
      { name: 'provisioning_status', type: "TEXT DEFAULT 'pending'" }
    ];
    
    for (const col of columns) {
      console.log(`Attempting to add column: ${col.name}`);
      // This won't work directly, but let's check what columns exist
    }
    
    return { error: 'Need to add columns via Supabase dashboard' };
  });
  
  if (alterError) {
    console.error('Note: You may need to add these columns via Supabase SQL Editor:');
    console.log(alterTableSQL);
  } else {
    console.log('✓ Columns added successfully');
  }
  
  // Check current table structure
  console.log('\nChecking current purchased_numbers structure:');
  const { data: sample, error: sampleError } = await supabase
    .from('purchased_numbers')
    .select('*')
    .limit(1);
  
  if (!sampleError && sample && sample.length > 0) {
    console.log('Current columns:', Object.keys(sample[0]));
  } else if (sampleError) {
    console.log('Error checking structure:', sampleError.message);
  } else {
    console.log('Table is empty, inserting test record to check structure...');
    
    // Try to insert a test record to see what columns are missing
    const { error: insertError } = await supabase
      .from('purchased_numbers')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        country_id: '2c03ce0d-e4db-495e-af00-7251116b4ce8',
        area_code_id: '2b66035b-07d9-4e5a-aa40-01568f2e822d',
        phone_number: '+1 212 000 0000',
        display_name: 'Test Number',
        is_active: false,
        sms_enabled: false,
        purchase_date: new Date().toISOString(),
        stripe_subscription_id: 'test_sub',
        stripe_checkout_session_id: 'test_session',
        monthly_price: 5.00,
        setup_price: 0.00,
        provisioning_status: 'pending'
      });
      
    if (insertError) {
      console.log('\nMissing columns detected from insert error:', insertError.message);
      console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log(alterTableSQL);
      console.log('----------------------------------------');
    } else {
      console.log('✓ All columns exist! Cleaning up test record...');
      await supabase
        .from('purchased_numbers')
        .delete()
        .eq('phone_number', '+1 212 000 0000');
    }
  }
  
  process.exit(0);
}

fixPurchasedNumbersColumns();