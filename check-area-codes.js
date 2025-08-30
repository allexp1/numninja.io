const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAreaCodes() {
  console.log('Checking area codes in database...\n');
  
  // Check if US country exists
  const { data: usCountry, error: countryError } = await supabase
    .from('countries')
    .select('id, code, name')
    .eq('code', 'us')
    .single();
    
  if (countryError) {
    console.error('Error finding US country:', countryError);
    return;
  }
  
  console.log('US Country:', usCountry);
  console.log('\n---\n');
  
  // Check area codes for US
  const { data: areaCodes, error: areaError } = await supabase
    .from('area_codes')
    .select('id, area_code, city_name')
    .eq('country_id', usCountry.id)
    .order('area_code');
    
  if (areaError) {
    console.error('Error fetching area codes:', areaError);
    return;
  }
  
  console.log(`Found ${areaCodes.length} area codes for US:`);
  console.log('\nArea codes containing "212" or "213":');
  
  areaCodes.forEach(ac => {
    if (ac.area_code === '212' || ac.area_code === '213') {
      console.log(`  ${ac.area_code} - ${ac.city_name} (ID: ${ac.id})`);
    }
  });
  
  console.log('\nAll US area codes:');
  areaCodes.forEach(ac => {
    console.log(`  ${ac.area_code} - ${ac.city_name}`);
  });
  
  process.exit(0);
}

checkAreaCodes();