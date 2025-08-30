require('dotenv').config({ path: '.env.local' });

async function testDIDWWAPI() {
  console.log('Testing DIDWW API Connection\n');
  console.log('=============================\n');
  
  const apiKey = process.env.DIDWW_API_KEY;
  const apiUrl = process.env.DIDWW_API_URL || 'https://api.didww.com/v3';
  const environment = process.env.DIDWW_ENVIRONMENT;
  
  console.log('Configuration:');
  console.log(`  API URL: ${apiUrl}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  API Key: ${apiKey ? '✓ Present' : '✗ Missing'}`);
  console.log(`  Key length: ${apiKey ? apiKey.length : 0} characters`);
  console.log('');
  
  if (!apiKey) {
    console.error('❌ DIDWW_API_KEY is not set!');
    process.exit(1);
  }
  
  try {
    // Test 1: Get countries
    console.log('Test 1: Fetching countries...');
    
    const countriesResponse = await fetch(`${apiUrl}/countries?page[size]=10`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      }
    });
    
    if (countriesResponse.status === 401) {
      console.error('❌ Authentication failed - Invalid API key');
      const errorText = await countriesResponse.text();
      console.error('Response:', errorText);
      process.exit(1);
    }
    
    if (!countriesResponse.ok) {
      console.error(`❌ API request failed: ${countriesResponse.status} ${countriesResponse.statusText}`);
      const errorText = await countriesResponse.text();
      console.error('Response:', errorText);
      process.exit(1);
    }
    
    const countriesData = await countriesResponse.json();
    
    if (countriesData.data && Array.isArray(countriesData.data)) {
      console.log(`✅ Successfully retrieved ${countriesData.data.length} countries`);
      console.log('Sample countries:');
      countriesData.data.slice(0, 5).forEach(country => {
        console.log(`  - ${country.attributes.name} (${country.attributes.iso})`);
      });
    } else {
      console.log('⚠️  Unexpected response format');
      console.log(JSON.stringify(countriesData, null, 2));
    }
    console.log('');
    
    // Test 2: Get available DIDs for US
    console.log('Test 2: Searching for available US phone numbers...');
    
    const didsResponse = await fetch(
      `${apiUrl}/available_dids?filter[countries.iso]=US&page[size]=5&include=did_group.area`,
      {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        }
      }
    );
    
    if (!didsResponse.ok) {
      console.error(`❌ DIDs request failed: ${didsResponse.status} ${didsResponse.statusText}`);
      const errorText = await didsResponse.text();
      console.error('Response:', errorText);
    } else {
      const didsData = await didsResponse.json();
      
      if (didsData.data && Array.isArray(didsData.data)) {
        console.log(`✅ Successfully found ${didsData.data.length} available US numbers`);
        if (didsData.data.length > 0) {
          console.log('Sample available numbers:');
          didsData.data.slice(0, 3).forEach(did => {
            const attrs = did.attributes;
            console.log(`  - Number: ${attrs.number || 'N/A'}`);
            if (attrs.setup_price || attrs.monthly_price) {
              console.log(`    Pricing: Setup $${attrs.setup_price || '0'}, Monthly $${attrs.monthly_price || '0'}`);
            }
          });
        }
      } else {
        console.log('⚠️  No available numbers found or unexpected format');
      }
    }
    
    // Summary
    console.log('\n=============================');
    console.log('API CONNECTION TEST SUMMARY\n');
    
    if (countriesResponse.ok) {
      console.log('✅ DIDWW API connection successful!');
      console.log('✅ Authentication working correctly');
      console.log('✅ API endpoints responding');
      console.log('\n🎉 Your DIDWW API credentials are working!');
      
      console.log('\n📝 Next Steps:');
      console.log('1. The provisioning system will now use real DIDWW API');
      console.log('2. Phone numbers will be actually provisioned when purchased');
      console.log('3. Configure webhooks in DIDWW dashboard for CDR and SMS');
    }
    
  } catch (error) {
    console.error('\n❌ DIDWW API Test Failed!\n');
    console.error('Error details:', error.message);
    
    if (error.cause?.code === 'ENOTFOUND') {
      console.error('\n🌐 Network Error: Cannot reach DIDWW API server');
      console.error('Check your internet connection and API URL');
    } else {
      console.error('\n⚠️  Unexpected error - see details above');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testDIDWWAPI();