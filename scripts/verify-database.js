#!/usr/bin/env node

/**
 * Verify Supabase database setup
 * This script checks that all tables exist and are properly configured
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// List of tables that should exist
const expectedTables = [
  'countries',
  'area_codes',
  'forwarding_prices',
  'profiles',
  'purchased_numbers',
  'number_configurations',
  'call_detail_records',
  'sms_records',
  'number_usage_stats',
  'provisioning_queue',
  'orders',
  'payments',
  'cart_items',
  'sms_configurations',
  'sms_filter_rules',
  'sms_forwarding_logs',
  'sms_auto_reply_logs'
];

// Tables that should be publicly readable
const publicTables = ['countries', 'area_codes', 'forwarding_prices'];

// Tables that require authentication
const protectedTables = [
  'profiles',
  'purchased_numbers',
  'number_configurations',
  'orders',
  'cart_items'
];

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Check if it's a "table doesn't exist" error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' };
      }
      // Check if it's an RLS error (which means table exists but is protected)
      if (error.message.includes('insufficient') || error.code === 'PGRST301') {
        return { exists: true, protected: true, count: null };
      }
      return { exists: true, error: error.message };
    }
    
    return { exists: true, protected: false, count: count || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkPublicData() {
  console.log('\n📊 Checking public data access...');
  
  for (const table of publicTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log(`  ✗ ${table}: ${error.message}`);
    } else {
      console.log(`  ✓ ${table}: ${count || 0} records (publicly accessible)`);
    }
  }
}

async function checkSampleData() {
  console.log('\n📋 Sample data check...');
  
  // Check for US country
  const { data: usCountry, error: countryError } = await supabase
    .from('countries')
    .select('*')
    .eq('code', 'US')
    .single();
  
  if (countryError) {
    console.log('  ✗ Could not fetch US country data');
  } else if (usCountry) {
    console.log(`  ✓ United States: ${usCountry.sms_capable ? 'SMS capable' : 'No SMS'}`);
    
    // Check for US area codes
    const { data: usAreaCodes, error: areaError } = await supabase
      .from('area_codes')
      .select('*')
      .eq('country_id', usCountry.id)
      .limit(3);
    
    if (areaError) {
      console.log('  ✗ Could not fetch US area codes');
    } else if (usAreaCodes && usAreaCodes.length > 0) {
      console.log(`  ✓ Sample US area codes:`);
      usAreaCodes.forEach(ac => {
        console.log(`    - ${ac.area_code} (${ac.city}): $${ac.base_price}/mo`);
      });
    } else {
      console.log('  ⚠️  No US area codes found');
    }
    
    // Check forwarding prices
    const { data: forwardingPrice, error: fpError } = await supabase
      .from('forwarding_prices')
      .select('*')
      .eq('country_id', usCountry.id)
      .single();
    
    if (!fpError && forwardingPrice) {
      console.log(`  ✓ US Forwarding: Mobile $${forwardingPrice.mobile_price}/mo, Landline $${forwardingPrice.landline_price}/mo`);
    }
  } else {
    console.log('  ⚠️  No country data found - run seed script');
  }
}

async function checkAuthenticationRequirement() {
  console.log('\n🔐 Checking authentication requirements...');
  
  // Try to access a protected table without authentication
  const { data, error } = await supabase
    .from('purchased_numbers')
    .select('*')
    .limit(1);
  
  if (error && (error.message.includes('insufficient') || error.code === 'PGRST301')) {
    console.log('  ✓ RLS is working - protected tables require authentication');
  } else if (!error) {
    console.log('  ⚠️  WARNING: Protected tables may be accessible without authentication');
  } else {
    console.log('  ℹ️  Could not verify RLS:', error.message);
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('Supabase Database Verification');
  console.log('═'.repeat(50));
  console.log(`Database: ${SUPABASE_URL}`);
  
  // Check all tables
  console.log('\n📁 Checking tables...');
  let missingTables = [];
  let existingTables = [];
  let protectedCount = 0;
  
  for (const table of expectedTables) {
    const result = await checkTable(table);
    
    if (!result.exists) {
      missingTables.push(table);
      console.log(`  ✗ ${table}: NOT FOUND`);
    } else {
      existingTables.push(table);
      if (result.protected) {
        protectedCount++;
        console.log(`  ✓ ${table}: EXISTS (protected by RLS)`);
      } else if (result.error) {
        console.log(`  ⚠️  ${table}: EXISTS (error: ${result.error})`);
      } else {
        console.log(`  ✓ ${table}: EXISTS (${result.count} records)`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('Summary:');
  console.log(`  Tables found: ${existingTables.length}/${expectedTables.length}`);
  console.log(`  Protected tables: ${protectedCount}`);
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('1. Go to: https://app.supabase.com/project/qzcjbmsrroolbkxodgbo/editor');
    console.log('2. Copy the contents of supabase/combined_migrations.sql');
    console.log('3. Paste and run in the SQL Editor');
    console.log('4. Run this verification script again');
  } else {
    console.log('\n✅ All expected tables exist!');
    
    // Additional checks
    await checkPublicData();
    await checkSampleData();
    await checkAuthenticationRequirement();
    
    console.log('\n' + '═'.repeat(50));
    console.log('Next Steps:');
    console.log('═'.repeat(50));
    
    // Check if there's data
    const { count } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });
    
    if (count === 0) {
      console.log('\n1. Run the seeding script to populate initial data:');
      console.log('   node scripts/seed-data.js');
      console.log('\n2. Test the application:');
      console.log('   npm run dev');
      console.log('\n3. Check the dashboard at http://localhost:3000/dashboard');
    } else {
      console.log('\n✅ Database is set up and contains data!');
      console.log('\nYou can now:');
      console.log('1. Run the application: npm run dev');
      console.log('2. Test purchasing a number');
      console.log('3. Configure number settings');
      console.log('4. Set up Stripe webhooks for production');
    }
  }
  
  console.log('\n' + '═'.repeat(50));
}

// Run the script
main().catch(console.error);