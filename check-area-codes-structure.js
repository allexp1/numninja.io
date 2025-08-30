const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAreaCodesStructure() {
  console.log('Checking area_codes table structure...\n');
  
  // Get US country ID
  const { data: usCountry } = await supabase
    .from('countries')
    .select('id, code, name')
    .eq('code', 'US')
    .single();
    
  if (!usCountry) {
    console.error('US country not found');
    return;
  }
  
  console.log('US Country:', usCountry);
  console.log('\n---\n');
  
  // Get all US area codes (select all columns)
  const { data: areaCodes, error } = await supabase
    .from('area_codes')
    .select('*')
    .eq('country_id', usCountry.id)
    .order('area_code');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${areaCodes.length} US area codes\n`);
  
  if (areaCodes.length > 0) {
    console.log('Sample area code structure:');
    console.log(JSON.stringify(areaCodes[0], null, 2));
    console.log('\n');
  }
  
  // Check for specific area codes
  const targetCodes = ['212', '213'];
  console.log('Looking for area codes:', targetCodes.join(', '));
  console.log('');
  
  targetCodes.forEach(code => {
    const found = areaCodes.find(ac => ac.area_code === code);
    if (found) {
      console.log(`✓ ${code} - Found (ID: ${found.id})`);
    } else {
      console.log(`✗ ${code} - NOT FOUND - Need to add this!`);
    }
  });
  
  console.log('\nAll US area codes:');
  areaCodes.forEach(ac => {
    console.log(`  ${ac.area_code} - ${ac.city || ac.name || 'No city name'}`);
  });
  
  process.exit(0);
}

checkAreaCodesStructure();