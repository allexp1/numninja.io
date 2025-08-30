const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('Checking User Setup\n');
  console.log('===================\n');
  
  // Check profiles table structure
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  } else if (profiles && profiles.length > 0) {
    console.log('Profile columns:', Object.keys(profiles[0]));
    console.log('\nProfiles found:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name || 'Not set'}`);
    });
  } else {
    console.log('No profiles found');
  }
  
  // Get auth users (this requires service role key)
  try {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('\nError fetching auth users:', authError);
    } else if (users && users.length > 0) {
      console.log('\n===================');
      console.log('Auth Users:\n');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      console.log('===================');
      console.log('📝 Admin Access Instructions:\n');
      console.log('For a user to be admin, they need one of these emails:');
      console.log('   - admin@test.com');
      console.log('   - admin@numninja.io');
      console.log('   - alex.p@didww.com');
      console.log('   - Any email ending with @numninja.io');
      console.log('\nYour current email is:', users[0].email);
      
      if (!users[0].email.includes('admin') && !users[0].email.endsWith('@numninja.io')) {
        console.log('\n⚠️  Your account is NOT an admin!');
        console.log('\n✅ Solution: Create a new account with admin@test.com');
        console.log('   1. Go to http://localhost:3000/auth/signup');
        console.log('   2. Sign up with email: admin@test.com');
        console.log('   3. Use any password you want');
        console.log('   4. After signup, visit http://localhost:3000/admin');
      } else {
        console.log('\n✅ Your account IS an admin!');
        console.log('   Visit http://localhost:3000/admin');
      }
    } else {
      console.log('\nNo auth users found');
      console.log('\n📝 Create your first admin user:');
      console.log('   1. Go to http://localhost:3000/auth/signup');
      console.log('   2. Sign up with email: admin@test.com');
      console.log('   3. Use any password you want');
      console.log('   4. After signup, visit http://localhost:3000/admin');
    }
  } catch (error) {
    console.log('\n📝 To access admin panel:');
    console.log('   1. Go to http://localhost:3000/auth/signup');
    console.log('   2. Sign up with email: admin@test.com');
    console.log('   3. Use any password you want');
    console.log('   4. After signup, visit http://localhost:3000/admin');
  }
  
  process.exit(0);
}

checkUsers();