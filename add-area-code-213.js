const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAreaCode213() {
  console.log('Adding area code 213 for Los Angeles...\n');
  
  // Add area code 213
  const { data: newAreaCode, error } = await supabase
    .from('area_codes')
    .insert({
      country_id: '2c03ce0d-e4db-495e-af00-7251116b4ce8', // US country ID
      area_code: '213',
      city: 'Los Angeles',
      base_price: 3.00,
      sms_addon_price: 2.00,
      is_sms_capable: true,
      is_available: true
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding area code:', error);
    // Check if it already exists
    const { data: existing } = await supabase
      .from('area_codes')
      .select('*')
      .eq('country_id', '2c03ce0d-e4db-495e-af00-7251116b4ce8')
      .eq('area_code', '213')
      .single();
      
    if (existing) {
      console.log('Area code 213 already exists:', existing);
    }
  } else {
    console.log('Successfully added area code 213:', newAreaCode);
  }
  
  // Verify both area codes exist
  console.log('\nVerifying area codes 212 and 213:');
  const { data: areaCodes } = await supabase
    .from('area_codes')
    .select('area_code, city')
    .eq('country_id', '2c03ce0d-e4db-495e-af00-7251116b4ce8')
    .in('area_code', ['212', '213'])
    .order('area_code');
    
  if (areaCodes) {
    areaCodes.forEach(ac => {
      console.log(`✓ ${ac.area_code} - ${ac.city}`);
    });
  }
  
  process.exit(0);
}

addAreaCode213();