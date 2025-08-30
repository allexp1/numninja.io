const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setAdminFlag() {
  console.log('Setting Admin Flag\n');
  console.log('==================\n');
  
  // Find the admin@test.com user
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching users:', authError);
    return;
  }
  
  const adminUser = users?.find(u => u.email === 'admin@test.com');
  
  if (!adminUser) {
    console.log('❌ No user with email admin@test.com found');
    console.log('\nPlease sign up with admin@test.com first');
    return;
  }
  
  console.log('Found admin@test.com user:');
  console.log('  ID:', adminUser.id);
  console.log('  Email:', adminUser.email);
  console.log('');
  
  // Update the profiles table to set is_admin = true
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', adminUser.id)
    .select();
  
  if (updateError) {
    console.error('Error updating profile:', updateError);
    
    // Try to insert if update failed (profile might not exist)
    console.log('\nTrying to insert profile...');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        is_admin: true
      });
    
    if (insertError) {
      console.error('Error inserting profile:', insertError);
    } else {
      console.log('✅ Profile created with admin flag!');
    }
  } else {
    console.log('✅ Admin flag set successfully!');
    console.log('Updated profile:', updateData);
  }
  
  // Verify the update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', adminUser.id)
    .single();
  
  console.log('\nProfile status:');
  console.log('  is_admin:', profile?.is_admin);
  
  console.log('\n📝 Next Steps:');
  console.log('1. Make sure you\'re signed in with admin@test.com');
  console.log('2. Try visiting http://localhost:3000/admin again');
  console.log('3. If it still redirects, try signing out and signing in again');
  
  // Also check if there's an alternative admin check
  console.log('\n📌 Alternative: The admin check might be using:');
  console.log('   - Email comparison (admin@test.com) ✓');
  console.log('   - is_admin field in profiles table ✓');
  console.log('   - Both should work now!');
  
  process.exit(0);
}

setAdminFlag();