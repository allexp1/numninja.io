#!/usr/bin/env node

/**
 * Seed initial data into Supabase database
 * This script populates countries, area codes, and forwarding prices
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Seed data
const seedData = {
  countries: [
    {
      code: 'US',
      name: 'United States',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'CA',
      name: 'Canada',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'AU',
      name: 'Australia',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'DE',
      name: 'Germany',
      sms_capable: true,
      documents_required: true
    },
    {
      code: 'FR',
      name: 'France',
      sms_capable: true,
      documents_required: true
    },
    {
      code: 'NL',
      name: 'Netherlands',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'ES',
      name: 'Spain',
      sms_capable: true,
      documents_required: false
    },
    {
      code: 'IT',
      name: 'Italy',
      sms_capable: true,
      documents_required: true
    },
    {
      code: 'SE',
      name: 'Sweden',
      sms_capable: true,
      documents_required: false
    }
  ],
  
  // Area codes will be added after countries are inserted
  area_codes: {
    'US': [
      { area_code: '212', city: 'New York', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '310', city: 'Los Angeles', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '312', city: 'Chicago', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '415', city: 'San Francisco', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '617', city: 'Boston', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '702', city: 'Las Vegas', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '786', city: 'Miami', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '713', city: 'Houston', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '206', city: 'Seattle', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '202', city: 'Washington DC', base_price: 5.00, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'GB': [
      { area_code: '20', city: 'London', base_price: 3.00, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '121', city: 'Birmingham', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '161', city: 'Manchester', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '141', city: 'Glasgow', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '131', city: 'Edinburgh', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '113', city: 'Leeds', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true },
      { area_code: '117', city: 'Bristol', base_price: 2.50, sms_addon_price: 1.50, is_sms_capable: true }
    ],
    'CA': [
      { area_code: '416', city: 'Toronto', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '514', city: 'Montreal', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '604', city: 'Vancouver', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '403', city: 'Calgary', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '613', city: 'Ottawa', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '780', city: 'Edmonton', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'AU': [
      { area_code: '2', city: 'Sydney', base_price: 6.00, sms_addon_price: 3.00, is_sms_capable: true },
      { area_code: '3', city: 'Melbourne', base_price: 6.00, sms_addon_price: 3.00, is_sms_capable: true },
      { area_code: '7', city: 'Brisbane', base_price: 6.00, sms_addon_price: 3.00, is_sms_capable: true },
      { area_code: '8', city: 'Adelaide', base_price: 6.00, sms_addon_price: 3.00, is_sms_capable: true }
    ],
    'DE': [
      { area_code: '30', city: 'Berlin', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '89', city: 'Munich', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '40', city: 'Hamburg', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '69', city: 'Frankfurt', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '221', city: 'Cologne', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'FR': [
      { area_code: '1', city: 'Paris', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '4', city: 'Marseille', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '3', city: 'Lyon', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '5', city: 'Toulouse', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'NL': [
      { area_code: '20', city: 'Amsterdam', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '10', city: 'Rotterdam', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '70', city: 'The Hague', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '30', city: 'Utrecht', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'ES': [
      { area_code: '91', city: 'Madrid', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '93', city: 'Barcelona', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '96', city: 'Valencia', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '95', city: 'Seville', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'IT': [
      { area_code: '06', city: 'Rome', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '02', city: 'Milan', base_price: 4.00, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '081', city: 'Naples', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true },
      { area_code: '011', city: 'Turin', base_price: 3.50, sms_addon_price: 2.00, is_sms_capable: true }
    ],
    'SE': [
      { area_code: '8', city: 'Stockholm', base_price: 4.50, sms_addon_price: 2.50, is_sms_capable: true },
      { area_code: '31', city: 'Gothenburg', base_price: 4.00, sms_addon_price: 2.50, is_sms_capable: true },
      { area_code: '40', city: 'Malmö', base_price: 4.00, sms_addon_price: 2.50, is_sms_capable: true }
    ]
  },
  
  forwarding_prices: [
    { country_code: 'US', mobile_price: 20.00, landline_price: 10.00 },
    { country_code: 'GB', mobile_price: 15.00, landline_price: 8.00 },
    { country_code: 'CA', mobile_price: 18.00, landline_price: 10.00 },
    { country_code: 'AU', mobile_price: 25.00, landline_price: 12.00 },
    { country_code: 'DE', mobile_price: 18.00, landline_price: 10.00 },
    { country_code: 'FR', mobile_price: 18.00, landline_price: 10.00 },
    { country_code: 'NL', mobile_price: 16.00, landline_price: 9.00 },
    { country_code: 'ES', mobile_price: 16.00, landline_price: 9.00 },
    { country_code: 'IT', mobile_price: 18.00, landline_price: 10.00 },
    { country_code: 'SE', mobile_price: 20.00, landline_price: 11.00 }
  ]
};

async function clearExistingData() {
  console.log('Clearing existing data...');
  
  // Delete in reverse order of dependencies
  const tables = [
    'forwarding_prices',
    'area_codes',
    'countries'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible UUID)
    
    if (error && !error.message.includes('0 rows')) {
      console.log(`Warning clearing ${table}:`, error.message);
    } else {
      console.log(`✓ Cleared ${table}`);
    }
  }
}

async function seedCountries() {
  console.log('\nSeeding countries...');
  
  const { data, error } = await supabase
    .from('countries')
    .insert(seedData.countries)
    .select();
  
  if (error) {
    console.error('Error seeding countries:', error);
    return null;
  }
  
  console.log(`✓ Seeded ${data.length} countries`);
  return data;
}

async function seedAreaCodes(countries) {
  console.log('\nSeeding area codes...');
  
  let totalAreaCodes = 0;
  
  for (const country of countries) {
    const areaCodes = seedData.area_codes[country.code];
    
    if (!areaCodes) {
      console.log(`No area codes defined for ${country.name}`);
      continue;
    }
    
    // Add country_id to each area code
    const areaCodesWithCountryId = areaCodes.map(ac => ({
      ...ac,
      country_id: country.id
    }));
    
    const { data, error } = await supabase
      .from('area_codes')
      .insert(areaCodesWithCountryId)
      .select();
    
    if (error) {
      console.error(`Error seeding area codes for ${country.name}:`, error);
    } else {
      console.log(`  ✓ ${country.name}: ${data.length} area codes`);
      totalAreaCodes += data.length;
    }
  }
  
  console.log(`✓ Total area codes seeded: ${totalAreaCodes}`);
}

async function seedForwardingPrices(countries) {
  console.log('\nSeeding forwarding prices...');
  
  const forwardingPricesWithIds = seedData.forwarding_prices.map(fp => {
    const country = countries.find(c => c.code === fp.country_code);
    if (!country) {
      console.warn(`Country not found for code: ${fp.country_code}`);
      return null;
    }
    
    return {
      country_id: country.id,
      mobile_price: fp.mobile_price,
      landline_price: fp.landline_price
    };
  }).filter(Boolean);
  
  const { data, error } = await supabase
    .from('forwarding_prices')
    .insert(forwardingPricesWithIds)
    .select();
  
  if (error) {
    console.error('Error seeding forwarding prices:', error);
  } else {
    console.log(`✓ Seeded ${data.length} forwarding price entries`);
  }
}

async function verifySeeding() {
  console.log('\n' + '='.repeat(50));
  console.log('Verifying seeded data...');
  
  // Check countries
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('*');
  
  if (countriesError) {
    console.error('Error fetching countries:', countriesError);
  } else {
    console.log(`✓ Countries in database: ${countries.length}`);
  }
  
  // Check area codes
  const { data: areaCodes, error: areaCodesError } = await supabase
    .from('area_codes')
    .select('*');
  
  if (areaCodesError) {
    console.error('Error fetching area codes:', areaCodesError);
  } else {
    console.log(`✓ Area codes in database: ${areaCodes.length}`);
  }
  
  // Check forwarding prices
  const { data: forwardingPrices, error: forwardingPricesError } = await supabase
    .from('forwarding_prices')
    .select('*');
  
  if (forwardingPricesError) {
    console.error('Error fetching forwarding prices:', forwardingPricesError);
  } else {
    console.log(`✓ Forwarding prices in database: ${forwardingPrices.length}`);
  }
  
  // Sample some data
  if (countries && countries.length > 0) {
    console.log('\nSample data:');
    const usCountry = countries.find(c => c.code === 'US');
    if (usCountry && areaCodes) {
      const usAreaCodes = areaCodes.filter(ac => ac.country_id === usCountry.id);
      console.log(`  United States has ${usAreaCodes.length} area codes`);
      if (usAreaCodes.length > 0) {
        console.log(`  Sample: ${usAreaCodes[0].area_code} - ${usAreaCodes[0].city} ($${usAreaCodes[0].base_price}/mo)`);
      }
    }
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Supabase Data Seeder');
  console.log('='.repeat(50));
  console.log(`Database: ${SUPABASE_URL}`);
  
  try {
    // Clear existing data (optional - comment out if you want to preserve existing data)
    await clearExistingData();
    
    // Seed countries first
    const countries = await seedCountries();
    
    if (!countries) {
      console.error('Failed to seed countries. Aborting.');
      process.exit(1);
    }
    
    // Seed area codes
    await seedAreaCodes(countries);
    
    // Seed forwarding prices
    await seedForwardingPrices(countries);
    
    // Verify the seeding
    await verifySeeding();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Data seeding completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Unexpected error during seeding:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);