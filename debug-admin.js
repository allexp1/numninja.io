const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAdminCheck() {
  console.log('Debugging Admin Check\n');
  console.log('=====================\n');
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    return;
  }
  
  if (!session) {
    console.log('No active session. Please sign in first.');
    return;
  }
  
  console.log('Current Session:');
  console.log('  User ID:', session.user.id);
  console.log('  Email:', session.user.email);
  console.log('  Role:', session.user.role);
  console.log('');
  
  // Check if email matches admin emails
  const adminEmails = ['admin@test.com', 'admin@numninja.io', 'alex.p@didww.com'];
  const userEmail = session.user.email;
  
  console.log('Admin Check:');
  console.log('  User email:', userEmail);
  console.log('  Admin emails:', adminEmails);
  console.log('  Is admin?:', adminEmails.includes(userEmail) || userEmail?.endsWith('@numninja.io'));
  
  // Get user data
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('\nUser Object:');
  console.log('  ID:', user?.id);
  console.log('  Email:', user?.email);
  console.log('  Email Confirmed:', user?.email_confirmed_at ? 'Yes' : 'No');
  
  // Check profile for is_admin field
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('\nProfile Data:');
    console.log('  is_admin field:', profile?.is_admin);
    console.log('  Profile ID:', profile?.id);
  }
  
  console.log('\n📝 Solution:');
  if (userEmail === 'admin@test.com') {
    console.log('✅ You are signed in with admin@test.com');
    console.log('   The admin check should work.');
    console.log('   If it\'s still failing, the issue might be:');
    console.log('   1. Case sensitivity in email comparison');
    console.log('   2. The getCurrentUser() function not working properly');
    console.log('   3. Session not being properly passed to the admin check');
  } else {
    console.log('⚠️  You are NOT signed in with admin@test.com');
    console.log('   Current email:', userEmail);
    console.log('   Sign out and sign in with admin@test.com');
  }
  
  process.exit(0);
}

debugAdminCheck();