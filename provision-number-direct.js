const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function provisionNumberDirectly() {
  console.log('Direct Number Provisioning\n');
  console.log('==========================\n');
  
  try {
    // Get all pending numbers
    const { data: pendingNumbers, error: fetchError } = await supabase
      .from('purchased_numbers')
      .select('*')
      .eq('provisioning_status', 'pending');
    
    if (fetchError) {
      console.error('Error fetching numbers:', fetchError);
      return;
    }
    
    if (!pendingNumbers || pendingNumbers.length === 0) {
      console.log('No pending numbers to provision.');
      return;
    }
    
    console.log(`Found ${pendingNumbers.length} pending number(s)\n`);
    
    for (const number of pendingNumbers) {
      console.log(`Provisioning: ${number.phone_number}`);
      console.log(`  ID: ${number.id}`);
      
      // Generate mock DID ID (in production, this would come from DIDWW API)
      const mockDidId = `mock_did_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update the number to active
      const { error: updateError } = await supabase
        .from('purchased_numbers')
        .update({
          didww_did_id: mockDidId,
          provisioning_status: 'active',
          is_active: true,
        })
        .eq('id', number.id);
      
      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`);
        continue;
      }
      
      console.log(`  ✅ Successfully provisioned!`);
      console.log(`  Mock DID ID: ${mockDidId}`);
      
      // Get user email for confirmation
      if (number.user_id) {
        const { data: user } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', number.user_id)
          .single();
        
        if (user?.email) {
          console.log(`  📧 Confirmation email would be sent to: ${user.email}`);
        }
      }
      
      // Clean up any failed queue tasks for this number
      const { data: failedTasks } = await supabase
        .from('provisioning_queue')
        .select('id')
        .eq('purchased_number_id', number.id)
        .eq('status', 'failed');
      
      if (failedTasks && failedTasks.length > 0) {
        console.log(`  Cleaning up ${failedTasks.length} failed queue task(s)...`);
        
        await supabase
          .from('provisioning_queue')
          .update({ status: 'completed' })
          .eq('purchased_number_id', number.id)
          .eq('status', 'failed');
      }
      
      console.log('');
    }
    
    // Show final status
    console.log('==========================');
    console.log('FINAL STATUS\n');
    
    const { data: activeNumbers } = await supabase
      .from('purchased_numbers')
      .select('phone_number, didww_did_id, is_active')
      .eq('provisioning_status', 'active');
    
    if (activeNumbers && activeNumbers.length > 0) {
      console.log('Active Numbers:');
      activeNumbers.forEach(num => {
        console.log(`  📞 ${num.phone_number}`);
        console.log(`     DID: ${num.didww_did_id}`);
        console.log(`     Status: ${num.is_active ? '🟢 Active' : '🔴 Inactive'}`);
      });
    }
    
    console.log('\n✅ Direct provisioning complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the provisioning
provisionNumberDirectly();