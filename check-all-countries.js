const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCountries() {
  console.log('Checking all countries in database...\n');
  
  // Check all countries
  const { data: countries, error: countryError } = await supabase
    .from('countries')
    .select('id, code, name')
    .order('code');
    
  if (countryError) {
    console.error('Error fetching countries:', countryError);
    return;
  }
  
  console.log(`Found ${countries.length} countries:`);
  countries.forEach(c => {
    console.log(`  ${c.code} - ${c.name} (ID: ${c.id})`);
  });
  
  // Also check area codes count
  const { count } = await supabase
    .from('area_codes')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\nTotal area codes in database: ${count}`);
  
  process.exit(0);
}

checkCountries();