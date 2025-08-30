const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function makeUserAdmin() {
  console.log('Setting up Admin User\n');
  console.log('======================\n');
  
  // First, let's check if any users exist
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }
  
  if (users && users.length > 0) {
    console.log('Existing users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'} (${user.full_name || 'No name'})`);
    });
    
    console.log('\n⚠️  To make a user admin, they need one of these emails:');
    console.log('   - admin@test.com');
    console.log('   - admin@numninja.io');
    console.log('   - alex.p@didww.com');
    console.log('   - Any email ending with @numninja.io');
    
    // Update the first user's email to make them admin
    const firstUser = users[0];
    if (firstUser) {
      console.log(`\nUpdating user ${firstUser.email} to admin@test.com...`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email: 'admin@test.com' })
        .eq('id', firstUser.id);
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log('✅ User updated to admin!');
        console.log('\n📝 Next steps:');
        console.log('1. Sign in with email: admin@test.com');
        console.log('2. Use the same password you created');
        console.log('3. Visit http://localhost:3000/admin');
      }
    }
  } else {
    console.log('No users found. Creating admin user...');
    
    // Create a new admin user
    console.log('\n📝 Please sign up with:');
    console.log('   Email: admin@test.com');
    console.log('   Password: (your choice)');
    console.log('\nThen visit http://localhost:3000/admin');
  }
  
  process.exit(0);
}

makeUserAdmin();