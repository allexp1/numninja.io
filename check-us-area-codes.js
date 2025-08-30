const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUSAreaCodes() {
  console.log('Checking US area codes...\n');
  
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
  
  // Get all US area codes
  const { data: areaCodes, error } = await supabase
    .from('area_codes')
    .select('id, area_code, city_name')
    .eq('country_id', usCountry.id)
    .order('area_code');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${areaCodes.length} US area codes:\n`);
  
  // Check for specific area codes
  const targetCodes = ['212', '213'];
  console.log('Looking for area codes:', targetCodes.join(', '));
  console.log('');
  
  targetCodes.forEach(code => {
    const found = areaCodes.find(ac => ac.area_code === code);
    if (found) {
      console.log(`✓ ${code} - ${found.city_name} (ID: ${found.id})`);
    } else {
      console.log(`✗ ${code} - NOT FOUND`);
    }
  });
  
  console.log('\nAll US area codes:');
  areaCodes.forEach(ac => {
    console.log(`  ${ac.area_code} - ${ac.city_name}`);
  });
  
  process.exit(0);
}

checkUSAreaCodes();