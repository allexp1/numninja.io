const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testProvisioning() {
  console.log('Testing Provisioning System\n');
  console.log('============================\n');

  // 1. Check if there are any pending tasks in the queue
  console.log('1. Checking provisioning queue...');
  const { data: pendingTasks, error: queueError } = await supabase
    .from('provisioning_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (queueError) {
    console.error('Error checking queue:', queueError);
    return;
  }

  console.log(`   Found ${pendingTasks?.length || 0} pending tasks\n`);
  
  if (pendingTasks && pendingTasks.length > 0) {
    console.log('   Pending tasks:');
    pendingTasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.action} for number ${task.purchased_number_id}`);
    });
  }

  // 2. Check purchased numbers that need provisioning
  console.log('\n2. Checking purchased numbers...');
  const { data: unprovisionedNumbers, error: numbersError } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, provisioning_status, is_active, didww_did_id, created_at')
    .eq('provisioning_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (numbersError) {
    console.error('Error checking numbers:', numbersError);
    return;
  }

  console.log(`   Found ${unprovisionedNumbers?.length || 0} numbers pending provisioning\n`);
  
  if (unprovisionedNumbers && unprovisionedNumbers.length > 0) {
    console.log('   Numbers pending provisioning:');
    unprovisionedNumbers.forEach(num => {
      console.log(`   - ${num.phone_number} (ID: ${num.id})`);
    });
  }

  // 3. Test the provisioning processor API
  console.log('\n3. Testing provisioning API endpoint...');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '')}/api/provisioning/process`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const status = await response.json();
      console.log('   API Status:', JSON.stringify(status, null, 2));
    } else {
      console.log('   Note: Provisioning API endpoint not accessible (expected in development)');
    }
  } catch (error) {
    console.log('   Note: Could not reach provisioning API (normal for local testing)');
  }

  // 4. Check recently provisioned numbers
  console.log('\n4. Checking recently provisioned numbers...');
  const { data: activeNumbers, error: activeError } = await supabase
    .from('purchased_numbers')
    .select('phone_number, provisioning_status, is_active, didww_did_id, created_at')
    .eq('provisioning_status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  if (activeError) {
    console.error('Error checking active numbers:', activeError);
    return;
  }

  console.log(`   Found ${activeNumbers?.length || 0} active numbers\n`);
  
  if (activeNumbers && activeNumbers.length > 0) {
    console.log('   Active numbers:');
    activeNumbers.forEach(num => {
      console.log(`   - ${num.phone_number}`);
      console.log(`     DID ID: ${num.didww_did_id || 'Not set'}`);
      console.log(`     Active: ${num.is_active ? 'Yes' : 'No'}`);
    });
  }

  // 5. Summary
  console.log('\n============================');
  console.log('PROVISIONING SYSTEM SUMMARY\n');
  
  const { count: totalPurchased } = await supabase
    .from('purchased_numbers')
    .select('*', { count: 'exact', head: true });
    
  const { count: totalActive } = await supabase
    .from('purchased_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('provisioning_status', 'active');
    
  const { count: totalPending } = await supabase
    .from('purchased_numbers')
    .select('*', { count: 'exact', head: true })
    .eq('provisioning_status', 'pending');
    
  const { count: queuePending } = await supabase
    .from('provisioning_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`Total Purchased Numbers: ${totalPurchased || 0}`);
  console.log(`  - Active: ${totalActive || 0}`);
  console.log(`  - Pending: ${totalPending || 0}`);
  console.log(`  - Other: ${(totalPurchased || 0) - (totalActive || 0) - (totalPending || 0)}`);
  console.log(`\nQueue Tasks Pending: ${queuePending || 0}`);
  
  console.log('\n✅ Provisioning system check complete!');
  
  if ((totalPending || 0) > 0 || (queuePending || 0) > 0) {
    console.log('\n⚠️  There are items waiting to be provisioned.');
    console.log('To process them, you can:');
    console.log('1. Start the provisioning processor: npm run provisioning:start');
    console.log('2. Or manually trigger processing via the API');
  }
  
  process.exit(0);
}

testProvisioning();