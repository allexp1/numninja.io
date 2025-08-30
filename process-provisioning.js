const { ProvisioningQueueProcessor } = require('./lib/provisioning/queue-processor');
require('dotenv').config({ path: '.env.local' });

async function processProvisioningQueue() {
  console.log('Starting Manual Provisioning Processing\n');
  console.log('========================================\n');
  
  try {
    const processor = new ProvisioningQueueProcessor();
    
    console.log('Processing pending tasks...\n');
    
    // Process tasks one by one (for testing)
    let tasksProcessed = 0;
    const maxTasks = 10; // Process up to 10 tasks
    
    for (let i = 0; i < maxTasks; i++) {
      // Check if there are pending tasks
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      const { data: task } = await supabase
        .from('provisioning_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (!task) {
        if (tasksProcessed === 0) {
          console.log('No pending tasks found in the queue.');
        } else {
          console.log(`\n✅ Processed ${tasksProcessed} task(s) successfully!`);
        }
        break;
      }
      
      console.log(`Processing task ${task.id}:`);
      console.log(`  Action: ${task.action}`);
      console.log(`  Number ID: ${task.purchased_number_id}`);
      
      // Get number details
      const { data: number } = await supabase
        .from('purchased_numbers')
        .select('phone_number')
        .eq('id', task.purchased_number_id)
        .single();
      
      if (number) {
        console.log(`  Phone Number: ${number.phone_number}`);
      }
      
      // Process the task
      console.log('  Processing...');
      
      // Mark as processing
      await supabase
        .from('provisioning_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // Simulate provisioning (since we don't have real DIDWW credentials)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock DID ID
      const mockDidId = `mock_did_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update purchased number
      await supabase
        .from('purchased_numbers')
        .update({
          didww_did_id: mockDidId,
          provisioning_status: 'active',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.purchased_number_id);
      
      // Mark task as completed
      await supabase
        .from('provisioning_queue')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      console.log(`  ✅ Task completed! Mock DID ID: ${mockDidId}\n`);
      tasksProcessed++;
    }
    
    // Show final status
    console.log('\n========================================');
    console.log('PROVISIONING SUMMARY\n');
    
    const { data: activeNumbers } = await supabase
      .from('purchased_numbers')
      .select('phone_number, didww_did_id, provisioning_status')
      .eq('provisioning_status', 'active');
    
    if (activeNumbers && activeNumbers.length > 0) {
      console.log('Active Numbers:');
      activeNumbers.forEach(num => {
        console.log(`  📞 ${num.phone_number}`);
        console.log(`     DID ID: ${num.didww_did_id}`);
      });
    }
    
    console.log('\n✅ Manual provisioning complete!');
    
  } catch (error) {
    console.error('Error during provisioning:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the processor
processProvisioningQueue();