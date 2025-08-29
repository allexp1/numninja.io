#!/usr/bin/env node

/**
 * Script to create a test user in Supabase
 * This will create a user that can be used for testing
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://qzcjbmsrroolbkxodgbo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y2pibXNycm9vbGJreG9kZ2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzc2ODYsImV4cCI6MjA3MTgxMzY4Nn0.Bmoq_9WoGa0qi0ecyxnMfkT5SrVobynOXn89K_KHreg';

// Test users to create
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'admin123456',
    full_name: 'Admin User',
    phone: '+1234567890'
  },
  {
    email: 'test@test.com',
    password: 'test123456',
    full_name: 'Test User',
    phone: '+1987654321'
  }
];

async function createTestUsers() {
  console.log('🔧 Creating Test Users');
  console.log('════════════════════════');
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  for (const user of TEST_USERS) {
    console.log(`\n📧 Creating user: ${user.email}`);
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            phone: user.phone
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  User already exists: ${user.email}`);
          
          // Try to sign in to verify the user works
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          });
          
          if (signInError) {
            console.log(`❌ Cannot sign in as ${user.email}: ${signInError.message}`);
          } else {
            console.log(`✅ User exists and can sign in: ${user.email}`);
          }
        } else {
          console.log(`❌ Error creating user: ${error.message}`);
        }
      } else {
        console.log(`✅ User created successfully: ${user.email}`);
        
        if (data.user && !data.user.email_confirmed_at) {
          console.log(`📬 Email confirmation may be required for ${user.email}`);
          console.log(`   (If email confirmation is disabled, you can sign in immediately)`);
        }
      }
    } catch (err) {
      console.error(`❌ Unexpected error:`, err.message);
    }
  }
  
  console.log('\n════════════════════════');
  console.log('✅ Test user creation complete!');
  console.log('\n📝 You can now sign in with:');
  TEST_USERS.forEach(user => {
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log('');
  });
}

// Run the script
createTestUsers().catch(console.error);