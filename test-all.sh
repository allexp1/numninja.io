#!/bin/bash

echo "NumNinja Complete System Test"
echo "============================="
echo ""

# Test 1: Check DIDWW API
echo "1. Testing DIDWW API Connection..."
node test-didww-direct.js
echo ""

# Test 2: Check Provisioning Queue
echo "2. Checking Provisioning Queue..."
node test-provisioning.js
echo ""

# Test 3: Check Database Connection
echo "3. Testing Database Connection..."
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
supabase.from('countries').select('count', { count: 'exact', head: true })
  .then(({ count }) => console.log('✅ Database connected. Countries:', count))
  .catch(err => console.error('❌ Database error:', err.message));
"
echo ""

echo "Test complete! If all checks passed, your system is ready."
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the app"
echo "2. Run 'stripe listen --forward-to localhost:3000/api/stripe/webhook' for webhooks"
echo "3. Visit http://localhost:3000 to use the app"